// Bottom-up stack order, with a 16-level-safe grey per fuel-tech group:
// fossils dark (bottom), renewables light, solar lightest — so the stack reads
// dark-to-light even without colour.
export const FUELTECH_GROUPS = [
	{ id: 'coal', label: 'Coal', colour: '#111111' },
	{ id: 'distillate', label: 'Distillate', colour: '#333333' },
	{ id: 'gas', label: 'Gas', colour: '#555555' },
	{ id: 'bioenergy', label: 'Bioenergy', colour: '#777777' },
	{ id: 'hydro', label: 'Hydro', colour: '#999999' },
	{ id: 'wind', label: 'Wind', colour: '#bbbbbb' },
	{ id: 'battery_discharging', label: 'Battery', colour: '#dddddd' },
	{ id: 'solar', label: 'Solar', colour: '#eeeeee' }
] as const;

export const RENEWABLE_GROUPS = new Set([
	'bioenergy',
	'hydro',
	'wind',
	'solar',
	'battery_discharging'
]);

export type EnergyRow = { time: number } & Record<string, number>;
