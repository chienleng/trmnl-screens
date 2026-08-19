# TRMNL Screens status

Updated: 2026-08-19

## Current

- Version 0.2.3 is the current committed release.
- OG and TRMNL X routes render device-specific, server-side HTML and SVG.
- The application is deployed to Cloudflare Workers with production authentication.

## Next

- No separate committed plan is active; actionable work should be recorded in GitHub Issues.
- Continue verifying screens at native device sizes with JavaScript disabled.

## Risks

- Production authentication and workerd behaviour differ from the Vite development server.
- Greyscale, dimensions, and server-rendering constraints can make browser-only verification misleading.
- Deployment commands affect the production screen service.
