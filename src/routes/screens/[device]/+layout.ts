import { error } from '@sveltejs/kit';
import { isDeviceSlug } from '$lib/screens';
import type { LayoutLoad } from './$types';

// Live data + token auth — never prerendered (the index page links here, so
// without this the prerender crawler would try).
export const prerender = false;

export const load: LayoutLoad = ({ params }) => {
	if (!isDeviceSlug(params.device)) error(404, `Unknown device "${params.device}"`);
	return { device: params.device };
};
