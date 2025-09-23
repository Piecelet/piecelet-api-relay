import { Hono } from 'hono'
import type { Context } from 'hono'

export type Env = {
  IVA_KEY: string
  DOUBAN_API_KEY: string
  TMDB_BEARER: string
}

type CacheOptions = {
  enabled?: boolean
  ttl2xx?: number
  ttl404?: number
  addDebugHeaders?: boolean
  removeClientCacheControl?: boolean
}

type ProxyOptions = {
  // Incoming path prefix to strip, e.g., '/metacritic'
  stripPrefix: string
  // Upstream base URL, e.g., 'https://ee.iva-api.com/api/Metacritic'
  upstreamBase: string
  // Customize/augment query params before building target URL
  injectQuery?: (params: URLSearchParams, c: Context<{ Bindings: Env }>) => void
  // Mutate headers before forwarding to upstream
  headerMutator?: (headers: Headers, c: Context<{ Bindings: Env }>) => void
  // Cache behavior
  cache?: CacheOptions
}

const defaultCache: Required<CacheOptions> = {
  enabled: true,
  ttl2xx: 1800,
  ttl404: 60,
  addDebugHeaders: true,
  removeClientCacheControl: true,
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function makeProxyRouter(opts: ProxyOptions) {
  const cacheCfg: Required<CacheOptions> = { ...defaultCache, ...(opts.cache || {}) }
  const router = new Hono<{ Bindings: Env }>()

  const handler = async (c: Context<{ Bindings: Env }>) => {
    const incomingUrl = new URL(c.req.url)

    // noCache=1 bypass flag (not forwarded, not part of key)
    const paramsIn = new URLSearchParams(incomingUrl.search)
    const noCache = paramsIn.get('noCache') === '1'
    if (paramsIn.has('noCache')) paramsIn.delete('noCache')

    // Allow route-specific injection before normalization
    if (opts.injectQuery) opts.injectQuery(paramsIn, c)

    // Build normalized query string (stable ordering)
    const sortedEntries = Array.from(paramsIn.entries()).sort((a, b) => {
      if (a[0] === b[0]) return a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0
      return a[0] < b[0] ? -1 : 1
    })
    const normalizedSearch = sortedEntries.length
      ? `?${new URLSearchParams(sortedEntries).toString()}`
      : ''

    // Compute upstream target URL
    const prefixRE = new RegExp('^' + escapeRegExp(opts.stripPrefix) + '/?')
    const suffix = incomingUrl.pathname.replace(prefixRE, '')
    const target = new URL(opts.upstreamBase + (suffix ? `/${suffix}` : '') + normalizedSearch)

    // Build headers: start with incoming, drop hop-by-hop/personalization
    const headers = new Headers(c.req.headers)
    headers.delete('host')
    headers.delete('content-length')
    headers.delete('connection')
    headers.delete('cookie')
    headers.delete('authorization')
    if (opts.headerMutator) opts.headerMutator(headers, c)

    // Prepare request init
    const method = c.req.method
    const isCacheable = method === 'GET' || method === 'HEAD'
    const hasBody = !(method === 'GET' || method === 'HEAD')
    const reqInit: RequestInit = {
      method,
      headers,
      body: hasBody ? c.req.raw.body : undefined,
    }

    // Try cache
    let cacheKey: Request | undefined
    if (cacheCfg.enabled && isCacheable && !noCache) {
      cacheKey = new Request(target.toString(), { method: 'GET' })
      const cached = await caches.default.match(cacheKey)
      if (cached) {
        const hit = new Response(cached.body, cached)
        if (cacheCfg.addDebugHeaders) {
          hit.headers.set('X-Relay-Cache', 'HIT')
          hit.headers.set('X-Relay-Cache-Key', target.toString())
          const colo = (c.req.raw as any)?.cf?.colo
          if (colo) hit.headers.set('X-Relay-PoP', String(colo))
        }
        if (cacheCfg.removeClientCacheControl) hit.headers.delete('Cache-Control')
        return hit
      }
    }

    const resp = await fetch(target.toString(), reqInit)

    // Conditionally cache 2xx and 404
    if (cacheCfg.enabled && isCacheable && !noCache && cacheKey) {
      const status = resp.status
      const ok2xx = status >= 200 && status < 300
      const is404 = status === 404
      const shouldCache = ok2xx || is404
      if (shouldCache) {
        const ttl = ok2xx ? cacheCfg.ttl2xx : cacheCfg.ttl404
        const toCache = new Response(resp.body, resp)
        toCache.headers.set('Cache-Control', `public, s-maxage=${ttl}, stale-while-revalidate=60`)
        toCache.headers.set('Vary', 'Accept-Encoding')
        await caches.default.put(cacheKey, toCache.clone())

        const out = new Response(toCache.body, toCache)
        if (cacheCfg.addDebugHeaders) {
          out.headers.set('X-Relay-Cache', 'MISS')
          out.headers.set('X-Relay-Cache-Key', target.toString())
          const colo = (c.req.raw as any)?.cf?.colo
          if (colo) out.headers.set('X-Relay-PoP', String(colo))
        }
        if (cacheCfg.removeClientCacheControl) out.headers.delete('Cache-Control')
        return out
      }
    }

    // Pass-through (uncached or bypassed)
    const out = new Response(resp.body, resp)
    if (cacheCfg.addDebugHeaders) {
      if (isCacheable && cacheKey) out.headers.set('X-Relay-Cache-Key', target.toString())
      const colo = (c.req.raw as any)?.cf?.colo
      if (colo) out.headers.set('X-Relay-PoP', String(colo))
    }
    if (cacheCfg.removeClientCacheControl) out.headers.delete('Cache-Control')
    return out
  }

  router.all('/', handler)
  router.all('/*', handler)

  return router
}
