```txt
npm install
npm run dev
```

```txt
npm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```

Secrets (required)

```txt
# Metacritic (IVA) subscription key
wrangler secret put IVA_KEY

# Douban Frodo API key
wrangler secret put DOUBAN_API_KEY

# TMDB Bearer token (without the leading 'Bearer ')
wrangler secret put TMDB_BEARER
```

These are read at runtime via `c.env` and injected by the proxy routes.
