**Piecelet API Relay**

Cloudflare Worker (Hono) that relays selected third‑party APIs, hides credentials, and adds consistent edge caching.

Targets

- Metacritic (IVA): `/metacritic/*` → `https://ee.iva-api.com/api/Metacritic/*`
- Douban Frodo: `/douban/frodo/*` → `https://frodo.douban.com/api/*`
- TMDB: `/tmdb/*` → `https://api.themoviedb.org/*`
- OMDB: `/omdb/*` → `https://www.omdbapi.com/*`
- Goodreads: `/goodreads/*` → `https://www.goodreads.com/*`

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
- Goodreads
  - Pattern: `/goodreads/<path>?<query>` → `https://www.goodreads.com/<path>?<query>&key=...`

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

**Secrets & Configuration**

- Required variables are injected into `wrangler.jsonc` at build/deploy time.
- Keys:
  - `METACRITIC_KEY` — IVA subscription key
  - `DOUBAN_FRODO_KEY` — Douban Frodo apiKey
  - `TMDB_KEY` — TMDB token
  - `OMDB_KEY` — OMDB apikey
  - `GOODREADS_KEY` — Goodreads developer key
  - `IGDB_KEY` — IGDB API key
  - `IGDB_CLIENT_ID` — IGDB Client ID
  - Optional: `METACRITIC_UA`
- **Local Dev / Config Update**:
  - Use the helper script to set variables in `wrangler.jsonc`:
    ```bash
    npm run set-var -- METACRITIC_KEY "your_key"
    npm run set-var -- GOODREADS_KEY "your_key"
    # ... etc
    ```
  - This replaces placeholders like `<METACRITIC_KEY_HERE>` with the actual value.

**Development**

- Dev server: `pnpm dev`
- Entry: `src/index.ts`
- Local preview cache behavior may differ; confirm on preview/deploy.

**Deploy**

- Deploy: `pnpm deploy`
- Wrangler config: `wrangler.jsonc`
- GitHub Actions:
  - The workflow (`.github/workflows/deploy.yml`) uses `npm run set-var` to inject secrets from GitHub Actions Secrets/Variables into `wrangler.jsonc` before deploying.
  - Set these in GitHub Repository Secrets/Variables:
    - `RELAY_METACRITIC_KEY`
    - `RELAY_DOUBAN_FRODO_KEY`
    - `RELAY_TMDB_KEY`
    - `RELAY_OMDB_KEY`
    - `RELAY_GOODREADS_KEY`
    - `RELAY_IGDB_KEY`
    - `RELAY_IGDB_CLIENT_ID`
    - `RELAY_METACRITIC_UA` (Optional)

**Code Structure**

- `src/index.ts` — App mount points and health route
- `src/_lib/proxy.ts` — Shared proxy + cache core (`makeProxyRouter`)
- `src/goodreads/index.ts` — Goodreads proxy module
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
