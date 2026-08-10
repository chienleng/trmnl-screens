# trmnl-screens

Screens for [TRMNL](https://usetrmnl.com) e-ink devices, served from
**https://trmnl.chienleng.com** — a SvelteKit app styled with
[`@chienleng/stratum-ui`](https://github.com/chienleng/stratum-ui) under a
black-and-white brutalist theme, deployed to Cloudflare Workers.

TRMNL's hosted cloud renders the screens with its **Screenshot plugin**: it
points a headless browser at a screen URL on each refresh and handles the
per-device dithering and dimensions.

## Screens

Each screen renders at exact panel dimensions per device:

| Route      | OG TRMNL (800×480, 1-bit) | TRMNL X (1872×1404, 16-grey) |
| ---------- | ------------------------- | ---------------------------- |
| Demo       | `/screens/og/demo`        | `/screens/x/demo`            |
| NEM energy | `/screens/og/energy`      | `/screens/x/energy`          |
| Dashboard  | `/screens/og/dashboard`   | `/screens/x/dashboard`       |

`/` is a human-facing index. Screens are registered in `src/lib/screens.ts`;
`ScreenFrame` pins the pixel dimensions (the X designs at half size under
`zoom: 2` so rem-based tokens keep their physical size).

## Theming

- `src/lib/themes/brutalist.css` re-skins the full stratum-ui token API via
  `data-theme="brutalist"`: ink on paper, zero radii, solid offset shadows,
  mono display type. Greys are 4-bit-exact (`#111`…`#eee`) so the X's 16-level
  panel renders them without quantisation.
- `src/lib/eink.css` holds per-panel arms (`data-eink="mono" | "grey16"`) —
  the OG forces pure black/white text; the X keeps the grey ramp.

## Develop

```bash
pnpm install
cp .dev.vars.example .dev.vars   # fill in values
pnpm dev
```

Auth is skipped under `vite dev`. `pnpm build && pnpm preview` runs the real
worker (workerd) and enforces auth like production — verify Cloudflare-bound
changes there.

## Auth

`/screens/*` requires `SCREENS_TOKEN` in production: `Authorization: Bearer …`
(what the TRMNL Screenshot plugin sends via its custom-headers field) or
`?token=…` once per browser (a cookie remembers it).

## Deploy

```bash
pnpm deploy                                  # build + wrangler deploy
wrangler secret put SCREENS_TOKEN
wrangler secret put OPENELECTRICITY_API_KEY  # for the energy screen
```

The custom domain is attached in the Cloudflare dashboard, not in
`wrangler.jsonc`.

TRMNL side, per device: add the Screenshot plugin →
`https://trmnl.chienleng.com/screens/<device>/<screen>` with header
`Authorization: Bearer <token>`, enable "Always refresh" (charts render
client-side), refresh 15 min.

## Notes

- `wrangler` is pinned to 4.113.0 and `checkJs` is off: newer `wrangler types`
  embeds `typeof import(…/_worker)` once a build exists, which would make
  svelte-check type-check SvelteKit's bundled output.
- The `openelectricity` client is constructed with explicit `apiKey` **and**
  `baseUrl` — its `process.env` fallbacks throw on workerd.
