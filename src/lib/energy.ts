// Bottom-up stack order: fossils first, renewables above, solar on top, so the
// stack reads dense-to-open against the band patterns in
// $lib/components/charts/patterns.ts. Fills are patterns rather than a grey
// ramp — greys dither into noise at 1-bit and quantise unpredictably on the X.
export const FUELTECH_GROUPS = [
	{ id: 'coal', label: 'Coal' },
	{ id: 'distillate', label: 'Distillate' },
	{ id: 'gas', label: 'Gas' },
	{ id: 'bioenergy', label: 'Bioenergy' },
	{ id: 'hydro', label: 'Hydro' },
	{ id: 'wind', label: 'Wind' },
	{ id: 'battery_discharging', label: 'Battery' },
	{ id: 'solar', label: 'Solar' }
] as const;

export const RENEWABLE_GROUPS = new Set([
	'bioenergy',
	'hydro',
	'wind',
	'solar',
	'battery_discharging'
]);

export type EnergyRow = { time: number } & Record<string, number>;
