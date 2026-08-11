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
		sunrise: string[];
		sunset: string[];
		uv_index_max: (number | null)[];
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

export async function fetchWeather(fetcher: typeof fetch = fetch): Promise<WeatherResult> {
	const url = new URL('https://api.open-meteo.com/v1/forecast');
	url.searchParams.set('latitude', String(LOCATION.latitude));
	url.searchParams.set('longitude', String(LOCATION.longitude));
	url.searchParams.set(
		'current',
		'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m'
	);
	url.searchParams.set('hourly', 'temperature_2m,precipitation_probability');
	url.searchParams.set('daily', 'sunrise,sunset,uv_index_max');
	url.searchParams.set('timezone', LOCATION.timeZone);
	// Two days of hourly data so a 24h window starting at the current hour is
	// always fully covered, whatever the time of day.
	url.searchParams.set('forecast_days', '2');

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

export type WeatherPayload = {
	ok: true;
	error: null;
	location: string;
	temp: number;
	conditions: string;
	feels_like: number;
	wind: string;
	humidity: number;
	uv_max: number;
	sunrise: string;
	sunset: string;
	observed_at: string;
	rain_peak: number;
	point_start: number;
	point_interval: number;
	temps: number[];
	rain: number[];
};

/**
 * Shape for TRMNL's polling strategy: flat root keys (Liquid root scope),
 * display strings pre-formatted, and the hourly series in Highcharts'
 * compact pointStart/pointInterval form.
 */
export function toPluginPayload(data: OpenMeteoResponse): WeatherPayload {
	const { current, hourly, daily } = data;

	// Slice the next 24h starting at the current hour. Open-Meteo's hourly grid
	// starts at midnight local, so find where "now" falls on it.
	const nowHour = current.time.slice(0, 13); // YYYY-MM-DDTHH
	const start = Math.max(
		0,
		hourly.time.findIndex((t) => t.slice(0, 13) === nowHour)
	);
	const times = hourly.time.slice(start, start + HOURS);
	const temps = hourly.temperature_2m.slice(start, start + HOURS).map((t) => t ?? 0);
	const rain = hourly.precipitation_probability.slice(start, start + HOURS).map((p) => p ?? 0);

	return {
		ok: true,
		error: null,
		location: LOCATION.name,
		temp: Math.round(current.temperature_2m),
		conditions: weatherLabel(current.weather_code),
		feels_like: Math.round(current.apparent_temperature),
		wind: `${windDirection(current.wind_direction_10m)} ${Math.round(current.wind_speed_10m)} km/h`,
		humidity: Math.round(current.relative_humidity_2m),
		uv_max: Math.round(daily.uv_index_max[0] ?? 0),
		sunrise: clockTime(daily.sunrise[0]),
		sunset: clockTime(daily.sunset[0]),
		observed_at: clockTime(current.time),
		rain_peak: rain.length > 0 ? Math.max(...rain) : 0,
		point_start: fakeUtcEpoch(times[0]),
		point_interval: 60 * 60 * 1000,
		temps: temps.map((t) => Math.round(t * 10) / 10),
		rain
	};
}
