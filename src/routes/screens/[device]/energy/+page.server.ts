import { FUELTECH_GROUPS } from '$lib/energy';
import { bucketRows, fetchNemEnergy } from '$lib/server/energy';
import { NEM_TIMEZONE } from '$lib/time';
import type { PageServerLoad } from './$types';

const CLOCK = new Intl.DateTimeFormat('en-AU', {
	hour: 'numeric',
	minute: '2-digit',
	hourCycle: 'h23',
	timeZone: NEM_TIMEZONE
});
const STAMP = new Intl.DateTimeFormat('en-AU', {
	weekday: 'short',
	day: 'numeric',
	month: 'short',
	hour: 'numeric',
	minute: '2-digit',
	timeZone: NEM_TIMEZONE
});

/** Chart resolution: 96 buckets across 24 h reads identically to the raw 5-min
    series at this pixel width, and keeps the SSR payload small. */
const BUCKET_MINUTES = 15;

export const load: PageServerLoad = async ({ platform }) => {
	const result = await fetchNemEnergy(platform?.env?.OPENELECTRICITY_API_KEY);
	if (!result.ok) return { energy: null, error: result.message };

	const { rows, latestTime, totalMw, renewablePct, peakMw } = result.data;
	const bucketed = bucketRows(rows, BUCKET_MINUTES);
	const present = FUELTECH_GROUPS.filter((group) => rows.some((row) => group.id in row));

	return {
		energy: {
			// Bottom-up: fossils first, so the stack reads dense-to-open.
			series: present.map((group) => ({
				key: group.id,
				label: group.label,
				values: bucketed.map((row) => Math.round(row[group.id] ?? 0))
			})),
			totalGw: (totalMw / 1000).toFixed(1),
			peakGw: (peakMw / 1000).toFixed(1),
			renewablePct: Math.round(renewablePct),
			observedAt: STAMP.format(new Date(latestTime)),
			hourTicks: [0, 0.25, 0.5, 0.75, 1].map((f) => {
				const row = bucketed[Math.min(bucketed.length - 1, Math.round(f * (bucketed.length - 1)))];
				return row ? CLOCK.format(new Date(row.time)) : '';
			})
		},
		error: null
	};
};
