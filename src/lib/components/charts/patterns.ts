/**
 * Fill patterns for stacked bands, ordered densest (darkest) to sparsest.
 *
 * A grey ramp is the obvious choice and the wrong one here: on the 1-bit OG
 * every grey dithers into noise and adjacent bands stop being separable, and
 * on the 16-level X the greys quantise to steps that shift with the panel's
 * palette. Hard black-and-white patterns read identically on both, which is
 * the same reasoning behind TRMNL's own dither ramp for charts.
 *
 * Tile geometry is emitted at `tile * scale` so the texture keeps its physical
 * coarseness on the X rather than becoming an invisibly fine screen.
 */
export type BandPattern = {
	id: string;
	/** Base tile size in OG pixels. */
	tile: number;
	/** Shape drawn inside one tile, at base scale. */
	draw: 'solid' | 'diagonal' | 'crosshatch' | 'horizontal' | 'vertical' | 'dots';
	/** Stroke or dot weight in OG pixels. */
	weight: number;
};

/**
 * Ordered densest to sparsest so a stack reads dark at the bottom and open at
 * the top — the same visual grammar as the fossil-to-renewable ordering it is
 * usually carrying.
 *
 * No entry is blank: an unfilled band is indistinguishable from the background
 * above the stack, which hid Solar — normally the largest midday band — behind
 * nothing but its own outline.
 */
export const BAND_PATTERNS: BandPattern[] = [
	{ id: 'solid', tile: 4, draw: 'solid', weight: 0 },
	{ id: 'cross', tile: 4, draw: 'crosshatch', weight: 1.4 },
	{ id: 'diag', tile: 4, draw: 'diagonal', weight: 1.6 },
	{ id: 'horiz', tile: 4, draw: 'horizontal', weight: 1.2 },
	{ id: 'dots', tile: 4, draw: 'dots', weight: 1.2 },
	{ id: 'diagw', tile: 7, draw: 'diagonal', weight: 1.2 },
	{ id: 'dotsw', tile: 7, draw: 'dots', weight: 1.1 },
	{ id: 'vert', tile: 8, draw: 'vertical', weight: 1.1 }
];

/** Cycle so a series list longer than the pattern set still gets distinct fills. */
export function patternFor(index: number): BandPattern {
	return BAND_PATTERNS[index % BAND_PATTERNS.length];
}
