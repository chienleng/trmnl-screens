import { json } from '@sveltejs/kit';
import { fetchNemEnergy, toPluginPayload } from '$lib/server/energy';
import type { RequestHandler } from './$types';

// Polled by the TRMNL "NEM Power" private plugin (see trmnl/nem-power/).
// Never cached: TRMNL does its own change detection on the payload.
const NO_STORE = { 'cache-control': 'no-store' };

export const GET: RequestHandler = async ({ platform }) => {
	const result = await fetchNemEnergy(platform?.env?.OPENELECTRICITY_API_KEY);

	if (!result.ok) {
		// An empty-but-healthy window is a real answer (200) that the template
		// renders as a labelled card. Hard failures 503 so TRMNL's poll fails
		// and the device keeps the last good screen — its "Data to …" label
		// already shows the staleness.
		const status = result.reason === 'no_data' ? 200 : 503;
		return json(
			{ ok: false, error: result.message, updated_at: null, series: [] },
			{ status, headers: NO_STORE }
		);
	}

	return json(toPluginPayload(result.data), { headers: NO_STORE });
};
