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
