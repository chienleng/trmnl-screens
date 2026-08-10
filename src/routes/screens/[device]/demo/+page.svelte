<script lang="ts">
	import { Badge, StatTile, Table } from '@chienleng/stratum-ui/ui';
	import { createSeriesStore, Sparkline } from '@chienleng/stratum-ui/charts';
	import ScreenHeader from '$lib/components/ScreenHeader.svelte';

	// Deterministic synthetic series — a day of half-hourly readings.
	const start = new Date('2026-08-10T00:00:00+10:00').getTime();
	const readings = Array.from({ length: 48 }, (_, i) => ({
		date: new Date(start + i * 30 * 60_000),
		value: 62 + Math.sin(i / 5) * 22 + Math.sin(i / 1.7) * 6
	}));

	const spark = createSeriesStore(
		{ output: readings },
		{ labels: { output: 'Output' }, formatValue: (v: number) => `${Math.round(v)}%` }
	);

	const regions = [
		{ code: 'NSW1', label: 'New South Wales', mw: 8412, status: 'Operating' },
		{ code: 'QLD1', label: 'Queensland', mw: 6690, status: 'Operating' },
		{ code: 'VIC1', label: 'Victoria', mw: 5108, status: 'Maintenance' },
		{ code: 'SA1', label: 'South Australia', mw: 1522, status: 'Operating' },
		{ code: 'TAS1', label: 'Tasmania', mw: 1180, status: 'Operating' }
	];
</script>

<ScreenHeader title="Demo" meta="stratum-ui sampler" />

<!-- Not StatGrid: its viewport breakpoints collapse to 2 columns at 800px,
     but a screen frame is fixed-size — the column count must be too. -->
<div class="stats">
	<StatTile label="Output" value="84%">
		{#snippet footer()}<Badge variant="success">Nominal</Badge>{/snippet}
	</StatTile>
	<StatTile label="Devices" value={128}>
		{#snippet footer()}<Badge>2 offline</Badge>{/snippet}
	</StatTile>
	<StatTile label="Alerts" value={3}>
		{#snippet footer()}<Badge variant="warning">1 critical</Badge>{/snippet}
	</StatTile>
</div>

<div class="split">
	<section>
		<h2 class="label">Regions</h2>
		<Table
			compact
			cellUtils
			caption="NEM regions"
			headers={['Region', 'Name', { label: 'MW', class: 'num' }, 'Status']}
		>
			{#each regions as region (region.code)}
				<tr>
					<td class="mono">{region.code}</td>
					<td>{region.label}</td>
					<td class="num mono">{region.mw.toLocaleString('en-AU')}</td>
					<td>{region.status}</td>
				</tr>
			{/each}
		</Table>
	</section>
	<section>
		<h2 class="label">Output — last 24h</h2>
		<Sparkline chart={spark} seriesKey="output" height={72} showEndDot showDates />
	</section>
</div>

<style>
	.stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--su-space-4);
	}

	.split {
		flex: 1;
		display: grid;
		grid-template-columns: 3fr 2fr;
		gap: var(--su-space-5);
		margin-top: var(--su-space-4);
		min-height: 0;
	}

	.label {
		margin: 0 0 var(--su-space-2);
		font-family: var(--su-font-mono);
		font-size: var(--su-font-size-xs);
		font-weight: var(--su-font-weight-medium);
		letter-spacing: var(--su-tracking-widest);
		text-transform: uppercase;
	}
</style>
