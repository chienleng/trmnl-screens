<script lang="ts">
	import Columns from '$lib/components/charts/Columns.svelte';
	import Sparkline from '$lib/components/charts/Sparkline.svelte';
	import StackedArea from '$lib/components/charts/StackedArea.svelte';
	import { BAND_PATTERNS } from '$lib/components/charts/patterns';
	import { devices } from '$lib/screens';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const spec = $derived(devices[data.device]);
	const scale = $derived(spec.scale);
	const isX = $derived(data.device === 'x');
	const contentWidth = $derived(spec.width - 16 * scale);
	const halfWidth = $derived((contentWidth - 24 * scale) / 2);

	// Deterministic synthetic series — no Math.random, so the screen only
	// changes when the design does. That keeps it usable as a visual baseline.
	const wave = Array.from({ length: 48 }, (_, i) =>
		Math.round(62 + Math.sin(i / 5) * 22 + Math.sin(i / 1.7) * 6)
	);
	const bars = Array.from({ length: 24 }, (_, i) =>
		Math.round(50 + Math.sin(i / 3) * 40 + Math.cos(i / 1.3) * 8)
	);
	const stack = Array.from({ length: 4 }, (_, s) => ({
		key: `s${s}`,
		label: `Series ${s + 1}`,
		values: Array.from({ length: 40 }, (_, i) => Math.round(20 + Math.sin(i / 6 + s) * 12 + s * 4))
	}));
</script>

<div class="screen-head label">
	<span>Design language</span>
	<span>{spec.width}&times;{spec.height} &middot; {spec.eink} &middot; scale {scale}&times;</span>
</div>
<div class="rule"></div>

<div class="metrics">
	<div>
		<div class="label">Hero</div>
		<div class="value--hero">42&deg;</div>
	</div>
	<div>
		<div class="label">Extra large</div>
		<div class="value--xl">128</div>
	</div>
	<div>
		<div class="label">Large</div>
		<div class="value--lg">3.4<span class="value--unit">GW</span></div>
	</div>
	<div>
		<div class="label">Base</div>
		<div class="value">84%</div>
	</div>
</div>

<div class="grid">
	<div class="panel">
		<div class="panel-head label"><span>Sparkline</span><span>curveMonotoneX</span></div>
		<Sparkline values={wave} width={halfWidth} height={(isX ? 120 : 74) * scale} {scale} />
	</div>

	<div class="panel">
		<div class="panel-head label"><span>Columns</span><span>0&ndash;100 pinned</span></div>
		<Columns values={bars} width={halfWidth} height={(isX ? 120 : 74) * scale} max={100} {scale} />
	</div>
</div>

<div class="panel">
	<div class="panel-head label"><span>Stacked area</span><span>pattern fills</span></div>
	<StackedArea
		series={stack}
		width={contentWidth}
		height={(isX ? 240 : 120) * scale}
		{scale}
		idPrefix="demo"
	/>
</div>

<div class="panel">
	<div class="panel-head label">
		<span>Band patterns</span><span>{BAND_PATTERNS.length} distinct</span>
	</div>
	<div class="swatches">
		{#each BAND_PATTERNS as p (p.id)}
			<div class="swatch-item">
				<svg width={18 * scale} height={18 * scale} aria-hidden="true">
					<rect
						width={18 * scale}
						height={18 * scale}
						fill="url(#demo-{p.id})"
						stroke="#000"
						stroke-width={scale}
					/>
				</svg>
				<span class="label">{p.id}</span>
			</div>
		{/each}
	</div>
</div>

<style>
	.metrics {
		grid-template-columns: repeat(4, 1fr);
		margin-top: var(--sp-3);
		align-items: baseline;
	}

	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--sp-6);
	}

	.panel {
		margin-top: var(--sp-4);
	}

	.swatches {
		display: flex;
		flex-wrap: wrap;
		gap: var(--sp-2) var(--sp-5);
		margin-top: var(--sp-2);
	}

	.swatch-item {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
	}

	.swatch-item svg {
		display: block;
		flex-shrink: 0;
	}
</style>
