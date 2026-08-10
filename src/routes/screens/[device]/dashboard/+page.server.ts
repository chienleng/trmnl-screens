import { LOCATION } from '$lib/config';
import type { PageServerLoad } from './$types';

type OpenMeteoResponse = {
	current: {
		temperature_2m: number;
		apparent_temperature: number;
		relative_humidity_2m: number;
		weather_code: number;
		wind_speed_10m: number;
	};
	daily: {
		time: string[];
		weather_code: number[];
		temperature_2m_max: number[];
		temperature_2m_min: number[];
		precipitation_probability_max: (number | null)[];
	};
};

export const load: PageServerLoad = async ({ fetch }) => {
	const url = new URL('https://api.open-meteo.com/v1/forecast');
	url.searchParams.set('latitude', String(LOCATION.latitude));
	url.searchParams.set('longitude', String(LOCATION.longitude));
	url.searchParams.set(
		'current',
		'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m'
	);
	url.searchParams.set(
		'daily',
		'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max'
	);
	url.searchParams.set('timezone', LOCATION.timeZone);
	url.searchParams.set('forecast_days', '4');

	let weather: OpenMeteoResponse | null = null;
	try {
		const response = await fetch(url);
		if (response.ok) weather = (await response.json()) as OpenMeteoResponse;
	} catch {
		// Weather is decorative — the screen still renders without it.
	}

	return {
		now: Date.now(),
		current: weather?.current ?? null,
		forecast:
			weather?.daily.time.map((date, i) => ({
				date,
				code: weather.daily.weather_code[i],
				max: weather.daily.temperature_2m_max[i],
				min: weather.daily.temperature_2m_min[i],
				precipProb: weather.daily.precipitation_probability_max[i]
			})) ?? []
	};
};
