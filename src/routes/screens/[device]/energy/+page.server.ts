import { OpenElectricityClient } from 'openelectricity';
import { FUELTECH_GROUPS, RENEWABLE_GROUPS, type EnergyRow } from '$lib/energy';
import { NEM_TIMEZONE, naiveLocalTime } from '$lib/time';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	const apiKey = platform?.env?.OPENELECTRICITY_API_KEY;
	if (!apiKey) {
		return { rows: [], configError: 'OPENELECTRICITY_API_KEY is not configured' };
	}

	// The client's process.env fallbacks throw on workerd (no `process` global
	// without nodejs_compat) — always pass apiKey AND baseUrl explicitly.
	const client = new OpenElectricityClient({
		apiKey,
		baseUrl: 'https://api.openelectricity.org.au/v4'
	});

	const now = new Date();
	const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

	const { datatable } = await client.getNetworkData('NEM', ['power'], {
		interval: '5m',
		dateStart: naiveLocalTime(dayAgo, NEM_TIMEZONE),
		dateEnd: naiveLocalTime(now, NEM_TIMEZONE),
		primaryGrouping: 'network',
		secondaryGrouping: ['fueltech_group'] // must be an array — the README's bare string throws
	});

	if (!datatable) {
		return { rows: [], configError: 'OpenElectricity returned no data' };
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

	// Headline stats from the most recent complete interval.
	const latest = rows.at(-1);
	let totalMw = 0;
	let renewableMw = 0;
	if (latest) {
		for (const group of FUELTECH_GROUPS) {
			const value = latest[group.id] ?? 0;
			totalMw += value;
			if (RENEWABLE_GROUPS.has(group.id)) renewableMw += value;
		}
	}

	return {
		rows,
		latestTime: latest?.time ?? null,
		totalMw,
		renewablePct: totalMw > 0 ? (renewableMw / totalMw) * 100 : 0,
		configError: null
	};
};
