import { OpenElectricityClient } from 'openelectricity';
import { FUELTECH_GROUPS, RENEWABLE_GROUPS, type EnergyRow } from '$lib/energy';
import { NEM_TIMEZONE, naiveLocalTime } from '$lib/time';

export type EnergyData = {
	/** 5-min pivoted rows, one per timestamp, keyed by fueltech group id. */
	rows: EnergyRow[];
	/** True UTC epoch ms of the most recent interval. */
	latestTime: number;
	totalMw: number;
	renewablePct: number;
	/** 24h peak of total generation, from the raw 5-min rows. */
	peakMw: number;
};

export type EnergyResult =
	| { ok: true; data: EnergyData }
	| { ok: false; reason: 'missing_key' | 'no_data' | 'upstream_error'; message: string };

export async function fetchNemEnergy(apiKey: string | undefined): Promise<EnergyResult> {
	if (!apiKey) {
		return {
			ok: false,
			reason: 'missing_key',
			message: 'OPENELECTRICITY_API_KEY is not configured'
		};
	}

	// The client's process.env fallbacks throw on workerd (no `process` global
	// without nodejs_compat) — always pass apiKey AND baseUrl explicitly.
	const client = new OpenElectricityClient({
		apiKey,
		baseUrl: 'https://api.openelectricity.org.au/v4'
	});

	const now = new Date();
	const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

	let datatable;
	try {
		({ datatable } = await client.getNetworkData('NEM', ['power'], {
			interval: '5m',
			dateStart: naiveLocalTime(dayAgo, NEM_TIMEZONE),
			dateEnd: naiveLocalTime(now, NEM_TIMEZONE),
			primaryGrouping: 'network',
			secondaryGrouping: ['fueltech_group'] // must be an array — the README's bare string throws
		}));
	} catch (error) {
		return {
			ok: false,
			reason: 'upstream_error',
			message: error instanceof Error ? error.message : 'OpenElectricity request failed'
		};
	}

	if (!datatable) {
		return { ok: false, reason: 'no_data', message: 'OpenElectricity returned no data' };
	}

	// Pivot long rows ({interval, fueltech_group, power}) into one row per
	// timestamp, keyed by group id. Loads (negative power) are clamped out —
	// a stacked area of generation only.
	const byTime = new Map<number, EnergyRow>();
	for (const row of datatable.getRows()) {
		const group = row.fueltech_group as string;
		const power = row.power as number | null;
		if (typeof power !== 'number' || !FUELTECH_GROUPS.some((g) => g.id === group)) continue;
		const time = (row.interval as Date).getTime();
		let entry = byTime.get(time);
		if (!entry) {
			entry = { time } as EnergyRow;
			byTime.set(time, entry);
		}
		entry[group] = Math.max(0, power);
	}

	const rows = [...byTime.values()].sort((a, b) => a.time - b.time);
	const latest = rows.at(-1);
	if (!latest) {
		return { ok: false, reason: 'no_data', message: 'No NEM data for the last 24 hours' };
	}

	// Headline stats from the most recent complete interval.
	let totalMw = 0;
	let renewableMw = 0;
	for (const group of FUELTECH_GROUPS) {
		const value = latest[group.id] ?? 0;
		totalMw += value;
		if (RENEWABLE_GROUPS.has(group.id)) renewableMw += value;
	}

	let peakMw = 0;
	for (const row of rows) {
		let total = 0;
		for (const group of FUELTECH_GROUPS) total += row[group.id] ?? 0;
		peakMw = Math.max(peakMw, total);
	}

	return {
		ok: true,
		data: {
			rows,
			latestTime: latest.time,
			totalMw,
			renewablePct: totalMw > 0 ? (renewableMw / totalMw) * 100 : 0,
			peakMw
		}
	};
}

/**
 * Mean-downsample 5-min rows onto a fixed `minutes` grid. Epochs are floored
 * onto the grid (Brisbane is UTC+10 with no DST, so the UTC grid and the
 * wall-clock grid coincide); each group's mean divides by the bucket's row
 * count, treating absent samples as 0 so the stack total stays consistent.
 * The trailing partial bucket is kept — it carries the freshest data.
 */
export function bucketRows(rows: EnergyRow[], minutes: number): EnergyRow[] {
	const ms = minutes * 60_000;
	const buckets = new Map<number, { count: number; sums: Record<string, number> }>();
	for (const row of rows) {
		const time = row.time - (row.time % ms);
		let bucket = buckets.get(time);
		if (!bucket) {
			bucket = { count: 0, sums: {} };
			buckets.set(time, bucket);
		}
		bucket.count += 1;
		for (const [key, value] of Object.entries(row)) {
			if (key === 'time') continue;
			bucket.sums[key] = (bucket.sums[key] ?? 0) + value;
		}
	}
	return [...buckets.entries()]
		.sort(([a], [b]) => a - b)
		.map(([time, { count, sums }]) => {
			const out = { time } as EnergyRow;
			for (const [key, sum] of Object.entries(sums)) out[key] = sum / count;
			return out;
		});
}

const BUCKET_MINUTES = 15;

/** Brisbane is UTC+10 year-round (no DST), so a constant shift is exact. */
const NEM_UTC_OFFSET_MS = 10 * 60 * 60 * 1000;

// Same format as the energy page's meta line, so the browser preview and the
// TRMNL plugin label timestamps identically.
const UPDATED_AT_FORMAT = new Intl.DateTimeFormat('en-AU', {
	weekday: 'short',
	day: 'numeric',
	month: 'short',
	hour: 'numeric',
	minute: '2-digit',
	timeZone: NEM_TIMEZONE
});

export type PluginPayload = {
	ok: true;
	error: null;
	updated_at: string;
	total_gw: string;
	renewable_pct: number;
	peak_gw: string;
	point_start: number;
	point_interval: number;
	series: Array<{ name: string; data: number[] }>;
};

/**
 * Shape EnergyData for TRMNL's private-plugin polling strategy: flat root keys
 * (they land at Liquid root scope), stats pre-formatted so the template does no
 * maths, and series in Highcharts' compact pointStart/pointInterval form.
 *
 * Everything is deterministic (integer rounding, no poll-time fields): TRMNL
 * skips screen regeneration when merge variables are byte-identical, which is
 * exactly right — the e-ink only refreshes when the data actually changed.
 */
export function toPluginPayload(data: EnergyData): PluginPayload {
	const bucketed = bucketRows(data.rows, BUCKET_MINUTES);
	const present = FUELTECH_GROUPS.filter((group) => data.rows.some((row) => group.id in row));
	return {
		ok: true,
		error: null,
		updated_at: UPDATED_AT_FORMAT.format(new Date(data.latestTime)),
		total_gw: (data.totalMw / 1000).toFixed(1),
		renewable_pct: Math.round(data.renewablePct),
		peak_gw: (data.peakMw / 1000).toFixed(1),
		// Brisbane wall-clock expressed as a fake-UTC epoch: Highcharts' default
		// UTC handling then prints correct AEST axis labels with no timezone
		// support needed inside TRMNL's render browser.
		point_start: bucketed[0].time + NEM_UTC_OFFSET_MS,
		point_interval: BUCKET_MINUTES * 60_000,
		series: present.map((group) => ({
			name: group.label,
			data: bucketed.map((row) => Math.round(row[group.id] ?? 0))
		}))
	};
}
