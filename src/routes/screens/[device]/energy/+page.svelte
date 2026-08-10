<script lang="ts">
	import { ChartStore, StackedAreaChart } from '@chienleng/stratum-ui/charts';
	import { StatTile } from '@chienleng/stratum-ui/ui';
	import ScreenHeader from '$lib/components/ScreenHeader.svelte';
	import { FUELTECH_GROUPS } from '$lib/energy';
	import { NEM_TIMEZONE } from '$lib/time';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const hourFormat = new Intl.DateTimeFormat('en-AU', {
		hour: 'numeric',
		hourCycle: 'h23',
		timeZone: NEM_TIMEZONE
	});
	const metaFormat = new Intl.DateTimeFormat('en-AU', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		hour: 'numeric',
		minute: '2-digit',
		timeZone: NEM_TIMEZONE
	});

	const present = $derived(
		FUELTECH_GROUPS.filter((group) => data.rows.some((row) => group.id in row))
	);

	const peakGw = $derived(
		data.rows.reduce((peak, row) => {
			const total = present.reduce((sum, group) => sum + (row[group.id] ?? 0), 0);
			return Math.max(peak, total);
		}, 0)
	);

	const chart = $derived.by(() => {
		const store = new ChartStore({
			key: Symbol('nem-power'),
			title: 'NEM generation',
			prefix: 'M',
			displayPrefix: 'G',
			allowedPrefixes: ['M', 'G'],
			baseUnit: 'W',
			chartType: 'stacked-area',
			timeZone: NEM_TIMEZONE,
			chartStyles: { chartHeightPx: data.device === 'x' ? 400 : 232 }
		});
		store.seriesData = data.rows.map((row) => ({ ...row, date: new Date(row.time) }));
		store.seriesNames = present.map((group) => group.id);
		store.seriesColours = Object.fromEntries(present.map((group) => [group.id, group.colour]));
		store.seriesLabels = Object.fromEntries(present.map((group) => [group.id, group.label]));
		store.formatTickX = (d) => (d instanceof Date ? hourFormat.format(d) : String(d));
		if (data.rows.length > 0) {
			store.xDomain = [data.rows[0].time, data.rows[data.rows.length - 1].time];
		}
		return store;
	});
</script>

<ScreenHeader
	title="NEM Power"
	meta={data.latestTime ? metaFormat.format(new Date(data.latestTime)) : ''}
/>

{#if data.configError}
	<p class="error">{data.configError}</p>
{:else}
	<!-- Not StatGrid: its viewport breakpoints collapse to 2 columns at 800px,
	     but a screen frame is fixed-size — the column count must be too. -->
	<div class="stats">
		<StatTile label="Renewables" value="{Math.round(data.renewablePct ?? 0)}%" />
		<StatTile label="Generation" value="{((data.totalMw ?? 0) / 1000).toFixed(1)} GW" />
		<StatTile label="24h peak" value="{(peakGw / 1000).toFixed(1)} GW" />
	</div>

	<div class="chart">
		<StackedAreaChart {chart} />
	</div>

	<ul class="legend">
		{#each present as group (group.id)}
			<li>
				<span class="swatch" style:background={group.colour}></span>
				{group.label}
			</li>
		{/each}
	</ul>
{/if}

<style>
	.stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--su-space-4);
	}

	.error {
		flex: 1;
		display: grid;
		place-content: center;
		font-family: var(--su-font-mono);
	}

	.chart {
		width: 100%;
		margin-top: var(--su-space-4);
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: var(--su-space-1) var(--su-space-4);
		margin: var(--su-space-2) 0 0;
		padding: 0;
		list-style: none;
		font-family: var(--su-font-mono);
		font-size: var(--su-font-size-xs);
	}

	.legend li {
		display: inline-flex;
		align-items: center;
		gap: var(--su-space-1);
	}

	.swatch {
		width: 0.75em;
		height: 0.75em;
		border: 1px solid var(--su-border);
	}
</style>
