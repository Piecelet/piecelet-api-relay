import { Hono } from 'hono'

const metacritic = new Hono()

const proxyMetacritic = async (c: import('hono').Context) => {
  const incomingUrl = new URL(c.req.url)

  // Optional bypass: noCache=1 to force origin
  const noCache = incomingUrl.searchParams.get('noCache') === '1'

  // Compute target URL: https://ee.iva-api.com/api/Metacritic/* + original query
  const suffix = incomingUrl.pathname.replace(/^\/metacritic\/?/, '')
  const base = 'https://ee.iva-api.com/api/Metacritic'
  const target = new URL(base + (suffix ? `/${suffix}` : ''))
  target.search = incomingUrl.search

  // Build headers, inject required key and user agent
  const headers = new Headers(c.req.headers)
  headers.delete('host')
  headers.delete('content-length')
  headers.delete('cookie')
  headers.delete('authorization')
  headers.set('ocp-apim-subscription-key', 'METACRITIC_KEY_REDACTED')
  headers.set('user-agent', 'METACRITIC_UA_REDACTED')

  const method = c.req.method
  const isCacheable = method === 'GET' || method === 'HEAD'
  const hasBody = !(method === 'GET' || method === 'HEAD')

  const reqInit: RequestInit = {
    method,
    headers,
    body: hasBody ? c.req.raw.body : undefined,
  }

  // Worker Cache API
  let cacheKey: Request | undefined
  if (isCacheable && !noCache) {
    cacheKey = new Request(target.toString(), { method: 'GET' })
    const cached = await caches.default.match(cacheKey)
    if (cached) {
      const hit = new Response(cached.body, cached)
      hit.headers.set('X-Relay-Cache', 'HIT')
      return hit
    }
  }

  const resp = await fetch(target.toString(), reqInit)

  // Cache successful GET/HEAD and short-cache 404
  if (isCacheable && !noCache && cacheKey) {
    const status = resp.status
    const ok2xx = status >= 200 && status < 300
    const is404 = status === 404
    const cacheable = ok2xx || is404

    if (cacheable) {
      const ttl = ok2xx ? 1800 : 60 // 2xx: 30m, 404: 60s
      const toCache = new Response(resp.body, resp)
      toCache.headers.set('Cache-Control', `public, s-maxage=${ttl}, max-age=${ttl}, stale-while-revalidate=60`)
      toCache.headers.set('Vary', 'Accept-Encoding')
      await caches.default.put(cacheKey, toCache.clone())

      const out = new Response(toCache.body, toCache)
      out.headers.set('X-Relay-Cache', 'MISS')
      return out
    }
  }

  return resp
}

// Handle both /metacritic and /metacritic/* when mounted
metacritic.all('/', proxyMetacritic)
metacritic.all('/*', proxyMetacritic)

export default metacritic
