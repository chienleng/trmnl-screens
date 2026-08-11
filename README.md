# trmnl-screens

Screens for [TRMNL](https://usetrmnl.com) e-ink devices, served from
**https://trmnl.chienleng.com** — a SvelteKit app styled with
[`@chienleng/stratum-ui`](https://github.com/chienleng/stratum-ui) under a
black-and-white brutalist theme, deployed to Cloudflare Workers.

TRMNL's hosted cloud renders the screens with its **Screenshot plugin**: it
points a headless browser at a screen URL on each refresh and handles the
per-device dithering and dimensions.

**Every screen is fully server-rendered, charts included.** Nothing waits on
hydration, so the capture cannot race the page — verified by screenshotting
each screen with JavaScript disabled.

## Screens

Each screen renders at exact panel dimensions, with a layout designed per
device rather than one design scaled:

| Route      | OG TRMNL (800×480, 1-bit) | TRMNL X (1872×1404, 16-grey) |
| ---------- | ------------------------- | ---------------------------- |
| Demo       | `/screens/og/demo`        | `/screens/x/demo`            |
| NEM energy | `/screens/og/energy`      | `/screens/x/energy`          |
| Weather    | `/screens/og/weather`     | `/screens/x/weather`         |
| Dashboard  | `/screens/og/dashboard`   | `/screens/x/dashboard`       |

`/` is a human-facing index. Screens are registered in `src/lib/screens.ts`.

## Rendering

**Charts are SSR SVG.** `src/lib/components/charts/` holds `StackedArea`,
`Sparkline` and `Columns`, which compute their geometry with `d3-shape` /
`d3-scale` at an explicit width and height. Panels are fixed, known sizes, so
nothing needs to measure the DOM. This replaced a LayerCake chart that
defaulted to `ssr = false` and sized itself from `bind:clientWidth` — it left
an empty div in the server HTML, which is why the graph screenshotted blank.

**Fills are patterns, not greys** (`charts/patterns.ts`). A grey ramp dithers
into noise on the 1-bit OG and quantises unpredictably on the X; hard
black-and-white hatching reads the same on both. `StackedArea` defines every
pattern, not just the ones its series use, so a legend elsewhere on the screen
can paint a matching swatch.

**Type is TRMNL's bitmap faces**, self-hosted in `static/fonts/`
(`src/lib/fonts.css`). No antialiasing means no grey edge pixels to dither.
They are drawn at exactly 12/16/21px and stay crisp only at integer multiples,
which is what `--scale` in `src/lib/screen.css` enforces — it is an integer per
device (OG 1×, X 2×) and every `--t-*` token is a multiple of a native size.

**`--scale` multiplies type and rules only, never the layout.** That leaves the
X with 936×702 design units against the OG's 800×480 — 17% wider but 46%
taller — so screens branch on `data.device` to use the extra room (the X
weather screen adds sunrise/sunset cells and a four-day outlook). The old
`zoom: 2` approach forced both panels to share one design.

## Theming

`src/lib/screen.css` is the screen design language: pure `#000` on `#fff`,
heavy rules, axis-free chart panels with their range stated in type beside
them. Build screens from its `--t-*` / `--sp-*` tokens; never hard-code a px
type size. There is no per-panel colour arm because there are no greys to
remap.

`src/lib/themes/brutalist.css` re-skins the stratum-ui `--su-*` tokens, which
now only dress the human-facing index page.

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
`Authorization: Bearer <token>`, refresh 15 min. Use the `og` screens on an OG
TRMNL and `x` on a TRMNL X so the layout matches the panel.

To check a screen at true size locally, screenshot the built worker with JS
off — this is what proves the capture never depends on hydration:

```bash
pnpm build && pnpm preview
docker run --rm -v "$PWD/shots:/shots" zenika/alpine-chrome \
  --no-sandbox --hide-scrollbars --disable-javascript \
  --screenshot=/shots/og-energy.png --window-size=800,480 \
  "http://host.docker.internal:4173/screens/og/energy?token=<token>"
```

## Private plugins (superseded)

> Kept for reference, not in use. These were the answer to the blank-chart
> problem before the screens rendered charts server-side; the Screenshot
> plugin now handles every screen, with far more layout freedom than Liquid
> templates allowed. Delete `trmnl/` and `src/routes/api/` if you want them
> gone — `src/lib/server/{energy,weather}.ts` is shared with the screens and
> must stay.

[Private plugins](https://help.trmnl.com/en/articles/9510536-private-plugins)
have TRMNL poll a JSON endpoint here and render the chart itself with
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
