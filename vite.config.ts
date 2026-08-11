import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		// trmnl-screens.localhost, not localhost: cookies are port-blind, so
		// every project served on plain localhost shares one cookie jar and the
		// stacked sessions eventually overflow Node's 16 KB header limit (431).
		// A *.localhost name resolves to loopback (RFC 6761) but is its own
		// cookie origin. The port is pinned (7605 in this machine's per-project
		// block) so bookmarks never chase an auto-incremented port.
		host: 'trmnl-screens.localhost',
		port: 7605,
		strictPort: true
	},
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	]
});
