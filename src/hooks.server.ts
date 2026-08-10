import { building, dev } from '$app/environment';
import type { Handle } from '@sveltejs/kit';

const COOKIE_NAME = 'screens_token';

/** Constant-time string comparison so the token can't be guessed byte-by-byte. */
function tokensMatch(a: string, b: string): boolean {
	const encoder = new TextEncoder();
	const bufA = encoder.encode(a);
	const bufB = encoder.encode(b);
	if (bufA.length !== bufB.length) return false;
	let diff = 0;
	for (let i = 0; i < bufA.length; i++) diff |= bufA[i] ^ bufB[i];
	return diff === 0;
}

// /screens/* is token-protected. TRMNL's Screenshot plugin sends the token as
// `Authorization: Bearer <token>` (configured as a custom header on the plugin);
// browsers can use `?token=` once, which is then remembered in a cookie.
export const handle: Handle = async ({ event, resolve }) => {
	// During `vite build` the prerender crawler follows the index page's links
	// into /screens/* (which it then discards — they're prerender = false), and
	// touching url.searchParams in that phase is an error. Auth only matters on
	// the deployed worker, so skip the guard entirely while building.
	if (building || !event.url.pathname.startsWith('/screens')) {
		return resolve(event);
	}

	const secret = event.platform?.env?.SCREENS_TOKEN;
	if (!secret) {
		// No token configured: open in local dev, locked in production —
		// failing open in prod would silently publish the screens.
		if (dev) return resolve(event);
		return new Response('SCREENS_TOKEN is not configured', { status: 401 });
	}

	const bearer = event.request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
	const query = event.url.searchParams.get('token');
	const cookie = event.cookies.get(COOKIE_NAME);

	const presented = bearer ?? query ?? cookie;
	if (!presented || !tokensMatch(presented, secret)) {
		return new Response('Unauthorised', { status: 401 });
	}

	// Remember a token presented via URL so in-browser navigation keeps working.
	if (query && !cookie) {
		event.cookies.set(COOKIE_NAME, query, {
			path: '/screens',
			httpOnly: true,
			secure: !dev,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 365
		});
	}

	return resolve(event);
};
