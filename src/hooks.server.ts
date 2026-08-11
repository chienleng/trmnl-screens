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

// Token-protected prefixes: /screens/* (TRMNL's Screenshot plugin) and /api/*
// (the private plugin's polling endpoint). Both send the token as
// `Authorization: Bearer <token>` (configured on the plugin); browsers can use
// `?token=` once on /screens, which is then remembered in a cookie. New /api
// routes are protected by default — fail closed.
const PROTECTED = ['/screens', '/api'];

/** API clients get a JSON 401 body; the browser-facing screens get plain text. */
function unauthorised(message: string, asJson: boolean): Response {
	return asJson
		? Response.json({ ok: false, error: message }, { status: 401 })
		: new Response(message, { status: 401 });
}

export const handle: Handle = async ({ event, resolve }) => {
	// Skipped while building — the prerender crawler follows the index page's
	// links into /screens/* (then discards them; they're prerender = false),
	// and touching url.searchParams in that phase is an error. Skipped in dev —
	// the guard exists for the public internet, not for localhost friction.
	// `pnpm preview` (wrangler) still enforces it, matching production.
	const { pathname } = event.url;
	if (dev || building || !PROTECTED.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
		return resolve(event);
	}

	const isApi = pathname === '/api' || pathname.startsWith('/api/');

	const secret = event.platform?.env?.SCREENS_TOKEN;
	if (!secret) {
		// Locked rather than open — failing open would silently publish the
		// screens the moment the secret went missing.
		return unauthorised('SCREENS_TOKEN is not configured', isApi);
	}

	const bearer = event.request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
	const query = event.url.searchParams.get('token');
	const cookie = event.cookies.get(COOKIE_NAME);

	const presented = bearer ?? query ?? cookie;
	if (!presented || !tokensMatch(presented, secret)) {
		return unauthorised('Unauthorised', isApi);
	}

	// Remember a token presented via URL so in-browser navigation keeps working.
	// The cookie is scoped to /screens, so only set it there.
	if (query && !cookie && pathname.startsWith('/screens')) {
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
