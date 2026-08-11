import { LOCATION } from '$lib/config';
import { fetchWeather, toScreenData } from '$lib/server/weather';
import type { PageServerLoad } from './$types';

const DATE = new Intl.DateTimeFormat('en-AU', {
	weekday: 'long',
	day: 'numeric',
	month: 'long',
	timeZone: LOCATION.timeZone
});
const TIME = new Intl.DateTimeFormat('en-AU', {
	hour: 'numeric',
	minute: '2-digit',
	hourCycle: 'h23',
	timeZone: LOCATION.timeZone
});

export const load: PageServerLoad = async ({ fetch }) => {
	// Shares the weather fetch with /screens/*/weather rather than issuing its
	// own Open-Meteo request with a parallel response type.
	const result = await fetchWeather(fetch);
	const now = new Date();

	return {
		dateLabel: DATE.format(now),
		timeLabel: TIME.format(now),
		// Weather is decorative here — the screen still reads without it.
		weather: result.ok ? toScreenData(result.data) : null
	};
};
