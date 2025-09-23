**Piecelet API Relay**

Cloudflare Worker (Hono) that relays selected third‑party APIs, hides credentials, and adds consistent edge caching.

Targets
- Metacritic (IVA): `/metacritic/*` → `https://ee.iva-api.com/api/Metacritic/*`
- Douban Frodo: `/douban/frodo/*` → `https://frodo.douban.com/api/*`
- TMDB: `/tmdb/*` → `https://api.themoviedb.org/*`

All routes share a core proxy that normalizes query params, injects headers/queries, and uses the Worker Cache API.

**Quick Start**
- Install: `npm install`
- Dev: `npm run dev`
- Deploy: `npm run deploy`

Set the required secrets first (see Secrets).

**Routes**
- Metacritic
  - Path: `/metacritic/*`
  - Upstream: `https://ee.iva-api.com/api/Metacritic/*`
  - Injected headers:
    - `ocp-apim-subscription-key: ${METACRITIC_KEY}`
    - `user-agent: METACRITIC_UA_REDACTED`
- Douban Frodo
  - Path: `/douban/frodo/*`
  - Upstream: `https://frodo.douban.com/api/*`
  - Query injection: `apiKey=${DOUBAN_FRODO_KEY}`
  - Injected headers:
    - `Referer: https://servicewechat.com/wx2f9b06c1de1ccfca/99/page-frame.html`
    - `User-Agent: Mozilla/5.0 ... WindowsWechat/WMPF XWEB/8391`
    - `Accept-Language: zh-CN,zh;q=0.9,en;q=0.8`
  - Injected cookie: `bid=<11-char random>`
- TMDB
  - Path: `/tmdb/*`
  - Upstream: `https://api.themoviedb.org/*`
  - Injected headers:
    - `Authorization: Bearer ${TMDB_KEY}` (client Authorization is ignored)
    - `accept: application/json`

**Examples**
- Douban Frodo
  - In: `/douban/frodo/v2/search/weixin?q=星期四&start=0&count=20`
  - Out: `https://frodo.douban.com/api/v2/search/weixin?q=星期四&start=0&count=20&apiKey=...`
- TMDB
  - In: `/tmdb/3/movie/movie_id?language=en-US`
  - Out: `https://api.themoviedb.org/3/movie/movie_id?language=en-US` with server‑side Bearer token
- Metacritic
  - In: `/metacritic/...`
  - Out: `https://ee.iva-api.com/api/Metacritic/...`

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
- Commands:
  - `wrangler secret put METACRITIC_KEY`
  - `wrangler secret put DOUBAN_FRODO_KEY`
  - `wrangler secret put TMDB_KEY`
- Each route validates presence at runtime and returns 500 if missing.

**Development**
- Dev server: `npm run dev`
- Type generation (optional): `npm run cf-typegen`
- Entry: `src/index.ts`
- Local preview cache behavior may differ; confirm on preview/deploy.

**Deploy**
- Deploy: `npm run deploy`
- Wrangler config: `wrangler.jsonc` (name, main, compatibility_date).

**Code Structure**
- `src/index.ts` — App mount points and health route
- `src/_lib/proxy.ts` — Shared proxy + cache core (`makeProxyRouter`)
- `src/types/env.ts` — Env typings (`METACRITIC_KEY`, `DOUBAN_FRODO_KEY`, `TMDB_KEY`)
- `src/metacritic` — Metacritic relay module
- `src/douban/frodo` — Douban Frodo relay module
- `src/tmdb` — TMDB relay module

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
- Private/internal; add a license if needed.
