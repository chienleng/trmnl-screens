import { fetchNemEnergy } from '$lib/server/energy';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	const result = await fetchNemEnergy(platform?.env?.OPENELECTRICITY_API_KEY);

	if (!result.ok) {
		return { rows: [], latestTime: null, totalMw: 0, renewablePct: 0, configError: result.message };
	}

	const { rows, latestTime, totalMw, renewablePct } = result.data;
	return { rows, latestTime, totalMw, renewablePct, configError: null };
};
