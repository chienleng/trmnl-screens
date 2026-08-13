# Releases and deployment

Use this procedure only when the user explicitly asks to release, deploy, or
ship. `pnpm deploy` replaces the production Cloudflare Worker.

1. Confirm the intended branch, working-tree scope, remote alignment, and what
   will ship. This repository does not currently use release tags.
2. Simplify the diff per `commits.md`, then run `pnpm lint`, `pnpm check`, and
   `pnpm build`.
3. Run `pnpm preview` and verify authentication plus every affected route at
   its actual device dimensions, with JavaScript disabled as documented in the
   README.
4. Confirm required Worker secrets exist. Never print or commit their values.
5. Run `pnpm deploy` only after explicit production authorisation.
6. Smoke-test the live route and report what shipped. Commit or push only if the
   user separately requested those Git actions.

Never force-push, bypass hooks, or casually change the Wrangler compatibility
date during a release.
