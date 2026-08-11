/** WMO weather interpretation codes (Open-Meteo `weather_code`) → short label. */
const WEATHER_CODES: Array<[codes: number[], label: string]> = [
	[[0], 'Clear'],
	[[1], 'Mostly clear'],
	[[2], 'Partly cloudy'],
	[[3], 'Overcast'],
	[[45, 48], 'Fog'],
	[[51, 53, 55, 56, 57], 'Drizzle'],
	[[61, 63, 66], 'Rain'],
	[[65, 67], 'Heavy rain'],
	[[71, 73, 75, 77], 'Snow'],
	[[80, 81], 'Showers'],
	[[82], 'Heavy showers'],
	[[85, 86], 'Snow showers'],
	[[95, 96, 99], 'Thunderstorm']
];

export function weatherLabel(code: number): string {
	return WEATHER_CODES.find(([codes]) => codes.includes(code))?.[1] ?? '—';
}

const COMPASS = [
	'N',
	'NNE',
	'NE',
	'ENE',
	'E',
	'ESE',
	'SE',
	'SSE',
	'S',
	'SSW',
	'SW',
	'WSW',
	'W',
	'WNW',
	'NW',
	'NNW'
];

/** Meteorological wind direction (degrees the wind blows *from*) → compass point. */
export function windDirection(degrees: number): string {
	return COMPASS[Math.round(degrees / 22.5) % 16];
}
