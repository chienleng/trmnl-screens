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

## Data sources

| Screen             | Source                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------- |
| Energy             | [OpenElectricity](https://openelectricity.org.au) v4 API, NEM power at 5-min intervals |
| Weather, Dashboard | [Open-Meteo](https://open-meteo.com) forecast API                                      |

Weather data is © Open-Meteo under CC BY 4.0, which requires visible
attribution. Both screens that use it carry the credit, and it must stay: the
weather screen puts it in the middle slot of the header, and the dashboard puts
it under the weather row rather than in the header, because only that row is
Open-Meteo data.

## Notes

- Screens were once TRMNL [private plugins](https://help.trmnl.com/en/articles/9510536-private-plugins)
  (`trmnl/` Liquid templates polling `/api/*` for Highcharts-shaped JSON) — the
  workaround for charts that screenshotted blank before they rendered
  server-side. Removed in full once SSR SVG made them redundant; see git
  history if the polling payload shapes are ever wanted back.
- `wrangler` is pinned to 4.113.0 and `checkJs` is off: newer `wrangler types`
  embeds `typeof import(…/_worker)` once a build exists, which would make
  svelte-check type-check SvelteKit's bundled output.
- The `openelectricity` client is constructed with explicit `apiKey` **and**
  `baseUrl` — its `process.env` fallbacks throw on workerd.
