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

## Private plugins

Charts can't survive the Screenshot plugin — they render client-side, and the
capture fires before hydration. These screens are
[private plugins](https://help.trmnl.com/en/articles/9510536-private-plugins)
instead: TRMNL polls a JSON endpoint here and renders the chart itself with
framework-hosted Highcharts + the `TRMNLCharts` dither helper.

| Plugin            | Endpoint       | Data                                           | Preview port |
| ----------------- | -------------- | ---------------------------------------------- | ------------ |
| `trmnl/nem-power` | `/api/energy`  | OpenElectricity NEM generation, 15-min buckets | 4567         |
| `trmnl/weather`   | `/api/weather` | Open-Meteo, next 24 h hourly temp + rain       | 4568         |

Both endpoints sit behind the same `SCREENS_TOKEN` guard as `/screens/*`
(`Authorization: Bearer …`), and both payloads are pre-shaped for Liquid — flat
root keys, formatted display strings, and series in Highcharts'
`pointStart`/`pointInterval` form.

The energy payload is deterministic, so TRMNL skips regeneration until the data
actually changes; the weather payload carries an observation time, so it
repaints each poll. `/screens/<device>/energy` and `/dashboard` remain as
browser previews.

Weather data is © [Open-Meteo](https://open-meteo.com) under CC BY 4.0 —
the attribution in the title bar is a licence requirement, not decoration.

Local preview with [trmnlp](https://github.com/usetrmnl/trmnlp) — it polls the
**deployed** worker (the dev server's `*.localhost` bind is IPv6-only, which
Docker can't reach from a container):

```bash
cd trmnl/weather   # or trmnl/nem-power, with -p 4567:4567
SCREENS_TOKEN=<token> docker run --pull always -p 4568:4567 \
  -v "$(pwd):/plugin" -e SCREENS_TOKEN trmnl/trmnlp serve --bind 0.0.0.0
# open http://localhost:4568; `build --png` renders the four layouts headlessly
```

TRMNL side, per plugin: [Private Plugin settings](https://usetrmnl.com/plugin_settings?keyname=private_plugin)
→ **Import new** with a flat zip of the five files in that plugin's `src/`
(or `trmnlp login && trmnlp push`), then fill in the **Base URL**
(`https://trmnl.chienleng.com`) and **Screens token** custom fields and Force
Refresh. The token is only ever entered in the dashboard — `settings.yml`
interpolates it via `{{ screens_token }}`.

## Notes

- `wrangler` is pinned to 4.113.0 and `checkJs` is off: newer `wrangler types`
  embeds `typeof import(…/_worker)` once a build exists, which would make
  svelte-check type-check SvelteKit's bundled output.
- The `openelectricity` client is constructed with explicit `apiKey` **and**
  `baseUrl` — its `process.env` fallbacks throw on workerd.
