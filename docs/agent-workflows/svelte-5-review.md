# Svelte 5 review guide

Review `.svelte`, `.svelte.js`, and `.svelte.ts` changes without broad,
unrequested refactors.

Check for derived values implemented as `$effect` assignments (prefer
`$derived`/`$derived.by`), large replace-only arrays held in deep `$state`
(consider `$state.raw`), legacy `on:event` syntax in new code, parent bindings
without child `$bindable()`, accidental debug logs, and missing cleanup. Keep
screen-critical output SSR-safe and useful with JavaScript disabled.
