# TRMNL Screens agent guide

This is the canonical guidance for any coding agent working in this repository.
Platform-specific instruction files must defer here rather than duplicate it.

## Start here

- Read `README.md`; it documents screen routes, authentication, device sizes,
  and the browser-capture contract.
- Preserve unrelated working-tree changes and use UK English in project copy.

## Commands and verification

- Use the pinned `pnpm` version through Corepack and Node 22.12 or later.
- `pnpm dev` serves `http://trmnl-screens.localhost:7605`; authentication is
  intentionally bypassed there.
- Run `pnpm check` after TypeScript or Svelte changes and `pnpm lint` when
  formatting or linting is relevant.
- Run `pnpm build && pnpm preview` for Cloudflare-bound changes. Preview uses
  workerd and enforces production authentication.
- There is no unit-test suite. Verify affected screen routes at their true
  device dimensions using the README capture procedure.

## Project rules

- This is Svelte 5/SvelteKit. Use runes and property event handlers in new code.
- Screens must render correctly from SSR with JavaScript disabled; TRMNL captures
  the initial HTML in a headless browser.
- Preserve the OG/TRMNL X size variants and the restricted greyscale visual
  language. Do not assume a desktop colour display.
- Construct the OpenElectricity client with explicit credentials and base URL;
  process environment fallbacks are not reliable under workerd.
- Keep secrets out of source and committed Worker configuration.

## Deployment and Git safety

- `pnpm deploy` is a production Cloudflare Workers deployment. Run it only when
  the user explicitly asks to deploy.
- Plain Worker configuration belongs in `wrangler.jsonc`; secrets use
  `wrangler secret put` and must never be committed.
- Before a commit, simplify the diff and run relevant verification. Stage named
  files only; never skip hooks, force-push, or add agent attribution.
- Follow `docs/agent-workflows/commits.md`, `svelte-5-review.md`, and
  `releases.md` when those workflows apply.
