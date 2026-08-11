import { fetchWeather, toScreenData } from '$lib/server/weather';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const result = await fetchWeather(fetch);
	return result.ok
		? { weather: toScreenData(result.data), error: null }
		: { weather: null, error: result.message };
};
