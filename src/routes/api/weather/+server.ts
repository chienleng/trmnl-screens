import { json } from '@sveltejs/kit';
import { fetchWeather, toPluginPayload } from '$lib/server/weather';
import type { RequestHandler } from './$types';

// Polled by the TRMNL "Weather" private plugin (see trmnl/weather/).
// Never cached: TRMNL does its own change detection on the payload.
const NO_STORE = { 'cache-control': 'no-store' };

export const GET: RequestHandler = async ({ fetch }) => {
	const result = await fetchWeather(fetch);

	if (!result.ok) {
		// 503 so TRMNL's poll fails and the device keeps its last good screen
		// rather than repainting an error card on a transient upstream blip.
		return json({ ok: false, error: result.message }, { status: 503, headers: NO_STORE });
	}

	return json(toPluginPayload(result.data), { headers: NO_STORE });
};
