# Commits and simplification

Use this workflow only when the user explicitly asks for a commit.

Review the proposed diff for reuse, clarity, unnecessary complexity, Svelte 5
conventions, SSR correctness, and device-size consistency. Apply safe
improvements without unrelated refactors.

Inspect status, branch, recent messages, and the complete diff. Stop for
secrets, empty or ambiguous scope. Run `pnpm check`, relevant lint/build checks,
and the README's true-size capture for affected screens. Update the README when
routes, auth, captures, device support, or deployment behaviour changes.

Stage named files only. Do not add agent attribution, skip hooks, amend
published commits, or push unless separately asked.
