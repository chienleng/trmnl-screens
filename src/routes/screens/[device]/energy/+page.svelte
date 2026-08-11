<script lang="ts">
	import StackedArea from '$lib/components/charts/StackedArea.svelte';
	import { patternFor } from '$lib/components/charts/patterns';
	import { devices } from '$lib/screens';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const spec = $derived(devices[data.device]);
	const scale = $derived(spec.scale);
	const isX = $derived(data.device === 'x');

	const contentWidth = $derived(spec.width - 16 * scale);
	const chartHeight = $derived((isX ? 430 : 265) * scale);
</script>

{#if data.energy}
	{@const e = data.energy}
	<div class="screen-head label">
		<span>NEM generation</span>
		<span>{e.observedAt}</span>
	</div>
	<div class="rule"></div>

	<div class="metrics">
		<div>
			<div class="label">Renewables</div>
			<div class="value--xl">{e.renewablePct}%</div>
		</div>
		<div>
			<div class="label">Generating</div>
			<div class="value--xl">{e.totalGw}<span class="value--unit">GW</span></div>
		</div>
		<div>
			<div class="label">24 h peak</div>
			<div class="value--xl">{e.peakGw}<span class="value--unit">GW</span></div>
		</div>
	</div>

	<div class="panel">
		<div class="panel-head label">
			<span>Generation by fuel &mdash; last 24 h</span>
			<span>0 to {e.peakGw} GW</span>
		</div>
		<StackedArea
			series={e.series}
			width={contentWidth}
			height={chartHeight}
			{scale}
			idPrefix="nem"
		/>
		<div class="scale label">
			{#each e.hourTicks as tick, i (i)}
				<span>{tick}</span>
			{/each}
		</div>
	</div>

	<!-- Direct-labelled key: the bands carry patterns rather than a colour ramp,
	     so the swatch has to show the same pattern to be any use. -->
	<div class="key" class:key--wrap={!isX}>
		{#each e.series as s, i (s.key)}
			{@const p = patternFor(i)}
			<div class="key-item">
				<svg class="swatch" width={14 * scale} height={14 * scale} aria-hidden="true">
					<rect
						width={14 * scale}
						height={14 * scale}
						fill="url(#nem-{p.id})"
						stroke="#000"
						stroke-width={scale}
					/>
				</svg>
				<span class="label">{s.label}</span>
			</div>
		{/each}
	</div>
{:else}
	<div class="screen-head label"><span>NEM generation</span><span>Unavailable</span></div>
	<div class="rule"></div>
	<div class="title--lg err">No data</div>
	<div class="label">{data.error}</div>
{/if}

<style>
	.metrics {
		grid-template-columns: repeat(3, 1fr);
		margin-top: var(--sp-3);
	}

	.panel {
		margin-top: var(--sp-4);
	}

	.scale {
		display: flex;
		justify-content: space-between;
		margin-top: var(--sp-1);
	}

	.key {
		display: flex;
		gap: var(--sp-2) var(--sp-5);
		margin-top: var(--sp-4);
		border-top: var(--rule-thin) solid #000;
		padding-top: var(--sp-2);
	}

	.key--wrap {
		flex-wrap: wrap;
	}

	.key-item {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
	}

	.swatch {
		display: block;
		flex-shrink: 0;
	}

	.err {
		margin-top: var(--sp-6);
	}
</style>
