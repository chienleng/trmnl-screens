<script lang="ts">
	import { area, stack, stackOrderNone, stackOffsetNone } from 'd3-shape';
	import { scaleLinear } from 'd3-scale';
	import { BAND_PATTERNS, patternFor } from './patterns';

	type Series = { key: string; label: string; values: number[] };

	let {
		series,
		width,
		height,
		scale = 1,
		idPrefix = 'sa'
	}: {
		series: Series[];
		width: number;
		height: number;
		/** Device type scale — keeps pattern tiles physically coarse on the X. */
		scale?: number;
		/** Namespaces pattern ids so two charts can coexist on one screen. */
		idPrefix?: string;
	} = $props();

	// Every geometry input is known server-side, so the chart is computed during
	// SSR and ships complete in the HTML. Nothing reads the DOM or waits for a
	// layout pass — that measurement dependency is what left the old LayerCake
	// chart blank when the screenshot fired.
	const pointCount = $derived(series[0]?.values.length ?? 0);

	const stacked = $derived.by(() => {
		if (pointCount === 0 || series.length === 0) return [];
		const rows = Array.from({ length: pointCount }, (_, i) =>
			Object.fromEntries(series.map((s) => [s.key, s.values[i] ?? 0]))
		);
		return stack<Record<string, number>>()
			.keys(series.map((s) => s.key))
			.order(stackOrderNone)
			.offset(stackOffsetNone)(rows);
	});

	const yMax = $derived(
		stacked.length === 0
			? 1
			: Math.max(1, ...stacked[stacked.length - 1].map((point) => point[1] ?? 0))
	);

	const x = $derived(
		scaleLinear()
			.domain([0, Math.max(1, pointCount - 1)])
			.range([0, width])
	);
	const y = $derived(scaleLinear().domain([0, yMax]).range([height, 0]));

	const shape = $derived(
		area<[number, number]>()
			.x((_, i) => x(i))
			.y0((point) => y(point[0]))
			.y1((point) => y(point[1]))
	);

	const bands = $derived(
		stacked.map((layer, i) => ({
			key: series[i].key,
			fill: `${idPrefix}-${patternFor(i).id}`,
			d: shape(layer as unknown as [number, number][]) ?? ''
		}))
	);
</script>

<svg {width} {height} viewBox="0 0 {width} {height}" role="img" aria-label="Stacked area chart">
	<defs>
		<!-- Every pattern is defined, not just the ones this chart's series use:
		     SVG pattern ids are document-scoped, so a legend elsewhere on the
		     screen can paint a swatch with the same fill. Defining only the used
		     subset left swatches for unused patterns silently blank. -->
		{#each BAND_PATTERNS as p (p.id)}
			{@const t = p.tile * scale}
			{@const w = p.weight * scale}
			<pattern id="{idPrefix}-{p.id}" width={t} height={t} patternUnits="userSpaceOnUse">
				{#if p.draw === 'solid'}
					<rect width={t} height={t} fill="#000" />
				{:else}
					<rect width={t} height={t} fill="#fff" />
					{#if p.draw === 'diagonal'}
						<!-- Corner repeats so the stroke joins across tile seams. -->
						<path
							d="M0,{t} L{t},0 M{-w},{w} L{w},{-w} M{t - w},{t + w} L{t + w},{t - w}"
							stroke="#000"
							stroke-width={w}
						/>
					{:else if p.draw === 'crosshatch'}
						<path d="M0,{t} L{t},0 M0,0 L{t},{t}" stroke="#000" stroke-width={w} />
					{:else if p.draw === 'horizontal'}
						<path d="M0,{t / 2} L{t},{t / 2}" stroke="#000" stroke-width={w} />
					{:else if p.draw === 'vertical'}
						<path d="M{t / 2},0 L{t / 2},{t}" stroke="#000" stroke-width={w} />
					{:else}
						<circle cx={t / 2} cy={t / 2} r={w} fill="#000" />
					{/if}
				{/if}
			</pattern>
		{/each}
	</defs>

	{#each bands as band (band.key)}
		<!-- Black boundary on every band: the pattern gives the fill its weight,
		     the outline keeps two adjacent textures from bleeding together. -->
		<path d={band.d} fill="url(#{band.fill})" stroke="#000" stroke-width={scale} />
	{/each}
</svg>

<style>
	svg {
		display: block;
	}
</style>
