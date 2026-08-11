# trmnl-screens

Screens for [TRMNL](https://usetrmnl.com) e-ink devices, served from
**https://trmnl.chienleng.com** — a SvelteKit app styled with
[`@chienleng/stratum-ui`](https://github.com/chienleng/stratum-ui) under a
black-and-white brutalist theme, deployed to Cloudflare Workers.

TRMNL's hosted cloud renders the screens with its **Screenshot plugin**: it
points a headless browser at a screen URL on each refresh and handles the
per-device dithering and dimensions.

The NEM energy screen instead ships as a **private plugin** (see below) —
client-side charts don't survive the Screenshot plugin's capture timing, so
TRMNL polls `/api/energy` for JSON and renders the chart itself.

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

## Private plugin (NEM Power)

`trmnl/nem-power/` is a TRMNL
[private plugin](https://help.trmnl.com/en/articles/9510536-private-plugins)
(polling strategy). TRMNL GETs `/api/energy` every 15 min — a Highcharts-ready
JSON payload (15-min buckets, pre-formatted stats) — and renders the stacked
area chart itself with the framework-hosted Highcharts + `TRMNLCharts` dither
helper. The payload is deterministic, so TRMNL only refreshes the e-ink when
the data actually changed. `/screens/<device>/energy` remains as a browser
preview.

The endpoint sits behind the same `SCREENS_TOKEN` guard as `/screens/*`
(`Authorization: Bearer …`).

Local preview with [trmnlp](https://github.com/usetrmnl/trmnlp) — it polls the
**deployed** worker (the dev server's `*.localhost` bind is IPv6-only, which
Docker can't reach from a container):

```bash
cd trmnl/nem-power
SCREENS_TOKEN=<token> docker run --pull always -p 4567:4567 \
  -v "$(pwd):/plugin" -e SCREENS_TOKEN trmnl/trmnlp serve --bind 0.0.0.0
# open http://localhost:4567; `build --png` renders the four layouts headlessly
```

TRMNL side: Plugins → Private Plugin → import a flat zip of the five files in
`trmnl/nem-power/src/` (or `trmnlp login && trmnlp push`), then fill in the
**Base URL** (`https://trmnl.chienleng.com`) and **Screens token** custom
fields and Force Refresh.

## Notes

- `wrangler` is pinned to 4.113.0 and `checkJs` is off: newer `wrangler types`
  embeds `typeof import(…/_worker)` once a build exists, which would make
  svelte-check type-check SvelteKit's bundled output.
- The `openelectricity` client is constructed with explicit `apiKey` **and**
  `baseUrl` — its `process.env` fallbacks throw on workerd.
