// Registry of available screens — drives the index page and route validation.
export const screens = [
	{
		slug: 'demo',
		title: 'Demo',
		description: 'stratum-ui sampler: stat tiles, table, badges and a sparkline.'
	},
	{
		slug: 'energy',
		title: 'Energy',
		description: 'OpenElectricity NEM power by fuel tech and renewables share.'
	},
	{
		slug: 'dashboard',
		title: 'Dashboard',
		description: 'Date, Melbourne weather (Open-Meteo) and placeholder agenda.'
	}
] as const;

export type ScreenSlug = (typeof screens)[number]['slug'];

export const devices = {
	og: { width: 800, height: 480, eink: 'mono' },
	x: { width: 1872, height: 1404, eink: 'grey16' }
} as const;

export type DeviceSlug = keyof typeof devices;

export function isDeviceSlug(value: string): value is DeviceSlug {
	return value in devices;
}

export function isScreenSlug(value: string): value is ScreenSlug {
	return screens.some((screen) => screen.slug === value);
}
