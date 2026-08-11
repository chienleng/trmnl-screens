// Registry of available screens — drives the index page and route validation.
export const screens = [
	{
		slug: 'demo',
		title: 'Demo',
		description: 'Design-language sampler: rules, metrics and the SSR chart primitives.'
	},
	{
		slug: 'energy',
		title: 'Energy',
		description: 'OpenElectricity NEM power by fuel tech and renewables share.'
	},
	{
		slug: 'weather',
		title: 'Weather',
		description: 'Melbourne conditions with 24-hour temperature and rain outlook.'
	},
	{
		slug: 'dashboard',
		title: 'Dashboard',
		description: 'Date, Melbourne weather (Open-Meteo) and placeholder agenda.'
	}
] as const;

export type ScreenSlug = (typeof screens)[number]['slug'];

/**
 * `scale` multiplies every type size and rule width. It must stay an INTEGER:
 * the TRMNL bitmap faces are drawn at exactly 12/16/21px and only stay crisp
 * at integer multiples of those.
 *
 * The X is 1872×1404 at ~227 PPI against the OG's 800×480 at ~124 PPI, so 2×
 * lands X text at roughly the same physical size as the OG's. That leaves the
 * X with 936×702 design units to the OG's 800×480 — 17% wider but 46% taller,
 * which is why the two panels get genuinely different layouts rather than one
 * scaled design.
 */
export const devices = {
	og: { width: 800, height: 480, eink: 'mono', scale: 1 },
	x: { width: 1872, height: 1404, eink: 'grey16', scale: 2 }
} as const;

export type DeviceSlug = keyof typeof devices;
export type DeviceSpec = (typeof devices)[DeviceSlug];

/** Usable design units for a panel — real pixels divided by the type scale. */
export function designSize(device: DeviceSlug): { width: number; height: number } {
	const { width, height, scale } = devices[device];
	return { width: width / scale, height: height / scale };
}

export function isDeviceSlug(value: string): value is DeviceSlug {
	return value in devices;
}

export function isScreenSlug(value: string): value is ScreenSlug {
	return screens.some((screen) => screen.slug === value);
}
