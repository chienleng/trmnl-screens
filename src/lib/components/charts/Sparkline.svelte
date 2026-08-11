<script lang="ts">
	import { line, curveMonotoneX } from 'd3-shape';
	import { scaleLinear } from 'd3-scale';

	let {
		values,
		width,
		height,
		scale = 1,
		strokeWidth = 3,
		pad = 0.06
	}: {
		values: number[];
		width: number;
		height: number;
		scale?: number;
		/** In OG pixels; multiplied by `scale`. */
		strokeWidth?: number;
		/** Fraction of the value range left as headroom above and below. */
		pad?: number;
	} = $props();

	// curveMonotoneX rather than a natural/cardinal spline: those overshoot
	// between points, which on a temperature trace invents highs and lows that
	// were never in the data. Monotone stays within the samples.
	const extent = $derived.by(() => {
		if (values.length === 0) return [0, 1] as const;
		const min = Math.min(...values);
		const max = Math.max(...values);
		if (min === max) return [min - 1, max + 1] as const;
		const room = (max - min) * pad;
		return [min - room, max + room] as const;
	});

	const x = $derived(
		scaleLinear()
			.domain([0, Math.max(1, values.length - 1)])
			.range([0, width])
	);
	const y = $derived(
		scaleLinear()
			.domain([...extent])
			.range([height, 0])
	);

	const d = $derived(
		line<number>()
			.x((_, i) => x(i))
			.y((v) => y(v))
			.curve(curveMonotoneX)(values) ?? ''
	);
</script>

<svg {width} {height} viewBox="0 0 {width} {height}" role="img" aria-label="Line chart">
	<path
		{d}
		fill="none"
		stroke="#000"
		stroke-width={strokeWidth * scale}
		stroke-linejoin="round"
		stroke-linecap="round"
	/>
</svg>

<style>
	svg {
		display: block;
	}
</style>
