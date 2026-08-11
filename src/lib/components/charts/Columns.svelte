<script lang="ts">
	import { scaleLinear } from 'd3-scale';

	let {
		values,
		width,
		height,
		max = 100,
		gap = 0.16,
		baseline = true,
		scale = 1
	}: {
		values: number[];
		width: number;
		height: number;
		/** Fixed axis top — pinned so bar heights read as absolute values
		    rather than rescaling to whatever the day's peak happens to be. */
		max?: number;
		/** Share of each slot left as gap. */
		gap?: number;
		baseline?: boolean;
		scale?: number;
	} = $props();

	const slot = $derived(values.length > 0 ? width / values.length : width);
	const barWidth = $derived(Math.max(1, slot * (1 - gap)));
	const y = $derived(scaleLinear().domain([0, max]).range([height, 0]));

	const bars = $derived(
		values.map((v, i) => {
			const top = y(Math.min(v, max));
			return {
				i,
				x: i * slot + (slot - barWidth) / 2,
				y: top,
				// Zero-height rects vanish; keep a hairline so an empty hour still
				// reads as a sampled zero rather than missing data.
				height: Math.max(v > 0 ? 1 : 0, height - top)
			};
		})
	);
</script>

<svg {width} {height} viewBox="0 0 {width} {height}" role="img" aria-label="Column chart">
	{#each bars as bar (bar.i)}
		<rect x={bar.x} y={bar.y} width={barWidth} height={bar.height} fill="#000" />
	{/each}
	{#if baseline}
		<line x1="0" y1={height} x2={width} y2={height} stroke="#000" stroke-width={scale} />
	{/if}
</svg>

<style>
	svg {
		display: block;
	}
</style>
