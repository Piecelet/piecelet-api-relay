**Piecelet API Relay**

Cloudflare Worker (Hono) that relays selected third‑party APIs, hides credentials, and adds consistent edge caching.

Targets
- Metacritic (IVA): `/metacritic/*` → `https://ee.iva-api.com/api/Metacritic/*`
- Douban Frodo: `/douban/frodo/*` → `https://frodo.douban.com/api/*`
- TMDB: `/tmdb/*` → `https://api.themoviedb.org/*`
- OMDB: `/omdb/*` → `https://www.omdbapi.com/*`

All routes share a core proxy that normalizes query params, injects headers/queries, and uses the Worker Cache API.

**Quick Start (pnpm)**
- Install: `pnpm install`
- Dev: `pnpm dev`
- Deploy: `pnpm deploy`

Set the required secrets first (see Secrets).

**Examples**
- Metacritic (IVA)
  - Pattern: `/metacritic/<path>?<query>` → `https://ee.iva-api.com/api/Metacritic/<path>?<query>`
- Douban Frodo
  - Pattern: `/douban/frodo/<path>?<query>` → `https://frodo.douban.com/api/<path>?<query>&apiKey=...`
- TMDB
  - Pattern: `/tmdb/3/<resource>?<query>` → `https://api.themoviedb.org/3/<resource>?<query>`
 - OMDB
  - Pattern: `/omdb/<path>?<query>` → `https://www.omdbapi.com/<path>?<query>&apikey=...`

**Caching**
- Worker Cache API (edge only).
- Methods: cache GET, HEAD.
- TTL: 2xx → 1800s; 404 → 60s; others not cached.
- Key normalization: removes `noCache`, sorts query params; includes injected params like `apiKey`.
- Bypass: add `noCache=1` to query.
- Debug headers:
  - `X-Relay-Cache: HIT|MISS`
  - `X-Relay-Cache-Key: <normalized upstream URL>`
  - `X-Relay-PoP: <Cloudflare colo>`
- Client responses omit `Cache-Control`; cached copy keeps `s-maxage` for edge TTL.

Note: Some platforms may restrict overriding headers like `User-Agent`. Validate in deployed Worker if a provider requires an exact UA.

**Secrets**
- Required secrets via Wrangler:
  - `METACRITIC_KEY` — IVA subscription key
  - `DOUBAN_FRODO_KEY` — Douban Frodo apiKey
  - `TMDB_KEY` — TMDB token (value without the `Bearer ` prefix)
  - `OMDB_KEY` — OMDB apikey
  - Optional: `METACRITIC_UA` — Custom User-Agent for Metacritic; if unset, no User-Agent header is sent upstream
- Commands:
  - `wrangler secret put METACRITIC_KEY`
  - `wrangler secret put DOUBAN_FRODO_KEY`
  - `wrangler secret put TMDB_KEY`
  - `wrangler secret put OMDB_KEY`
  - Optional: `wrangler secret put METACRITIC_UA`
- Each route validates presence at runtime and returns 500 if missing.

**Development**
- Dev server: `pnpm dev`
- Entry: `src/index.ts`
- Local preview cache behavior may differ; confirm on preview/deploy.

**Deploy**
- Deploy: `pnpm deploy`
- Wrangler config: `wrangler.jsonc` (name, main, compatibility_date).

**Code Structure**
- `src/index.ts` — App mount points and health route
- `src/_lib/proxy.ts` — Shared proxy + cache core (`makeProxyRouter`)
- `src/_lib/types/env.ts` — Env typings (`METACRITIC_KEY`, `DOUBAN_FRODO_KEY`, `TMDB_KEY`, `OMDB_KEY`, optional `METACRITIC_UA`)

**Path Aliases**
- Config: `tsconfig.json`
  - `@/*` → `src/*`
- Example: `import metacritic from '@/metacritic'`

**Troubleshooting**
- Repeated `MISS`:
  - Confirm identical URL; check `X-Relay-Cache-Key`.
  - Different PoPs warm independently; check `X-Relay-PoP`.
  - Validate on preview/deploy for edge cache behavior.

**License**
- See `LICENSE`
