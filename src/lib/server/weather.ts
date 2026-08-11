import { LOCATION } from '$lib/config';
import { weatherLabel, windDirection } from '$lib/weather';

type OpenMeteoResponse = {
	current: {
		time: string;
		temperature_2m: number;
		apparent_temperature: number;
		relative_humidity_2m: number;
		weather_code: number;
		wind_speed_10m: number;
		wind_direction_10m: number;
	};
	hourly: {
		time: string[];
		temperature_2m: (number | null)[];
		precipitation_probability: (number | null)[];
	};
	daily: {
		time: string[];
		sunrise: string[];
		sunset: string[];
		uv_index_max: (number | null)[];
		weather_code: number[];
		temperature_2m_max: (number | null)[];
		temperature_2m_min: (number | null)[];
		precipitation_probability_max: (number | null)[];
	};
};

export type WeatherResult = { ok: true; data: OpenMeteoResponse } | { ok: false; message: string };

/**
 * Open-Meteo returns timezone-naive local ISO strings (`2026-08-11T09:00`) when
 * `timezone` is set. Parsing them as if UTC yields a "fake-UTC" epoch whose
 * clock face is already Melbourne local time, so Highcharts' default UTC
 * handling labels the axis correctly. DST-safe: Open-Meteo did the conversion,
 * so unlike a fixed offset this survives the AEST/AEDT switch.
 */
function fakeUtcEpoch(naiveLocal: string): number {
	return Date.parse(`${naiveLocal}Z`);
}

/** `2026-08-11T07:10` → `7:10` */
function clockTime(naiveLocal: string): string {
	const [, time] = naiveLocal.split('T');
	const [hour, minute] = time.split(':');
	return `${Number(hour)}:${minute}`;
}

// Formatted off the fake-UTC epoch, so the zone is already baked in and the
// formatter must not shift it again.
const DATE_LABEL = new Intl.DateTimeFormat('en-AU', {
	weekday: 'short',
	day: 'numeric',
	month: 'short',
	timeZone: 'UTC'
});

export async function fetchWeather(fetcher: typeof fetch = fetch): Promise<WeatherResult> {
	const url = new URL('https://api.open-meteo.com/v1/forecast');
	url.searchParams.set('latitude', String(LOCATION.latitude));
	url.searchParams.set('longitude', String(LOCATION.longitude));
	url.searchParams.set(
		'current',
		'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m'
	);
	url.searchParams.set('hourly', 'temperature_2m,precipitation_probability');
	url.searchParams.set(
		'daily',
		'sunrise,sunset,uv_index_max,weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max'
	);
	url.searchParams.set('timezone', LOCATION.timeZone);
	// Five days: the hourly window only needs two (a 24h slice starting at the
	// current hour, whatever the time of day), but the X panel has room for a
	// multi-day outlook below the charts.
	url.searchParams.set('forecast_days', '5');

	try {
		const response = await fetcher(url);
		if (!response.ok) {
			return { ok: false, message: `Open-Meteo returned ${response.status}` };
		}
		return { ok: true, data: (await response.json()) as OpenMeteoResponse };
	} catch (error) {
		return {
			ok: false,
			message: error instanceof Error ? error.message : 'Open-Meteo request failed'
		};
	}
}

const HOURS = 24;

/**
 * The next 24 hourly samples starting at the current hour. Open-Meteo's grid
 * starts at local midnight, so find where "now" falls on it rather than
 * assuming an offset.
 */
function hourlyWindow(data: OpenMeteoResponse) {
	const { current, hourly } = data;
	const nowHour = current.time.slice(0, 13); // YYYY-MM-DDTHH
	const start = Math.max(
		0,
		hourly.time.findIndex((t) => t.slice(0, 13) === nowHour)
	);
	return {
		times: hourly.time.slice(start, start + HOURS),
		temps: hourly.temperature_2m.slice(start, start + HOURS).map((t) => t ?? 0),
		rain: hourly.precipitation_probability.slice(start, start + HOURS).map((p) => p ?? 0)
	};
}

export type WeatherScreenData = {
	location: string;
	dateLabel: string;
	observedAt: string;
	temp: number;
	conditions: string;
	feelsLike: number;
	windDir: string;
	windSpeed: number;
	humidity: number;
	uvMax: number;
	sunrise: string;
	sunset: string;
	tempMin: number;
	tempMax: number;
	rainPeak: number;
	rainPeakAt: string;
	/** 24 hourly samples from the current hour. */
	temps: number[];
	rain: number[];
	/** Hour labels at the quarter points, for the shared time scale. */
	hourTicks: string[];
	forecast: Array<{ day: string; min: number; max: number; rain: number; conditions: string }>;
};

const DAY_LABEL = new Intl.DateTimeFormat('en-AU', { weekday: 'short', timeZone: 'UTC' });

/**
 * Shape for the rendered screens. Numbers stay numbers — Svelte formats at the
 * point of use, and the screens need the raw series to compute chart geometry
 * server-side.
 */
export function toScreenData(data: OpenMeteoResponse): WeatherScreenData {
	const { current, daily } = data;
	const { times, temps, rain } = hourlyWindow(data);

	const peakRain = rain.length > 0 ? Math.max(...rain) : 0;
	const peakIndex = rain.indexOf(peakRain);

	return {
		location: LOCATION.name,
		dateLabel: DATE_LABEL.format(new Date(fakeUtcEpoch(current.time))),
		observedAt: clockTime(current.time),
		temp: Math.round(current.temperature_2m),
		conditions: weatherLabel(current.weather_code),
		feelsLike: Math.round(current.apparent_temperature),
		windDir: windDirection(current.wind_direction_10m),
		windSpeed: Math.round(current.wind_speed_10m),
		humidity: Math.round(current.relative_humidity_2m),
		uvMax: Math.round(daily.uv_index_max[0] ?? 0),
		sunrise: clockTime(daily.sunrise[0]),
		sunset: clockTime(daily.sunset[0]),
		tempMin: Math.round(Math.min(...temps)),
		tempMax: Math.round(Math.max(...temps)),
		rainPeak: peakRain,
		rainPeakAt: peakRain > 0 && peakIndex >= 0 ? clockTime(times[peakIndex]) : '',
		temps,
		rain,
		hourTicks: [0, 6, 12, 18, 23].map((i) => (times[i] ? clockTime(times[i]) : '')),
		// Skip today — the panels above already cover the next 24 hours.
		forecast: daily.time.slice(1).map((day, i) => ({
			day: DAY_LABEL.format(new Date(`${day}T00:00Z`)),
			min: Math.round(daily.temperature_2m_min[i + 1] ?? 0),
			max: Math.round(daily.temperature_2m_max[i + 1] ?? 0),
			rain: Math.round(daily.precipitation_probability_max[i + 1] ?? 0),
			conditions: weatherLabel(daily.weather_code[i + 1])
		}))
	};
}
