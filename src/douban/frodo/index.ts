import { Hono } from 'hono'

const frodo = new Hono()

const proxyFrodo = async (c: import('hono').Context) => {
  const incomingUrl = new URL(c.req.url)

  // Optional bypass: noCache=1 to force origin
  const inParams = new URLSearchParams(incomingUrl.search)
  const noCache = inParams.get('noCache') === '1'
  if (inParams.has('noCache')) inParams.delete('noCache')
  // Inject/override apiKey before normalizing so it's part of the cache key
  inParams.set('apiKey', 'DOUBAN_FRODO_KEY_REDACTED')
  // Normalize query params order for a stable cache key
  const sortedEntries = Array.from(inParams.entries()).sort((a, b) => {
    if (a[0] === b[0]) return a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0
    return a[0] < b[0] ? -1 : 1
  })
  const normalizedSearch = sortedEntries.length
    ? `?${new URLSearchParams(sortedEntries).toString()}`
    : ''

  // Map /douban/frodo/<suffix> -> https://frodo.douban.com/api/<suffix>
  const suffix = incomingUrl.pathname.replace(/^\/douban\/frodo\/?/, '')
  const base = 'https://frodo.douban.com/api'
  const target = new URL(base + (suffix ? `/${suffix}` : '') + normalizedSearch)

  // Forward headers (strip hop-by-hop and personalization)
  const headers = new Headers(c.req.headers)
  headers.delete('host')
  headers.delete('content-length')
  headers.delete('cookie')
  headers.delete('authorization')
  // Force required upstream-identifying headers
  headers.set('Referer', 'https://servicewechat.com/wx2f9b06c1de1ccfca/99/page-frame.html')
  headers.set(
    'User-Agent',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Windows WindowsWechat/WMPF XWEB/8391'
  )
  headers.set('Accept-Language', 'zh-CN,zh;q=0.9,en;q=0.8')
  // Add a random Douban bid cookie per request
  const genBid = (len = 11) => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-'
    const bytes = new Uint8Array(len)
    crypto.getRandomValues(bytes)
    let out = ''
    for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length]
    return out
  }
  headers.set('Cookie', `bid=${genBid()}`)

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
      hit.headers.set('X-Relay-Cache-Key', target.toString())
      const colo = (c.req.raw as any)?.cf?.colo
      // Remove Cache-Control on client response per request
      hit.headers.delete('Cache-Control')
      if (colo) hit.headers.set('X-Relay-PoP', String(colo))
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
      // Edge-cache for ttl seconds
      toCache.headers.set('Cache-Control', `public, s-maxage=${ttl}, stale-while-revalidate=60`)
      toCache.headers.set('Vary', 'Accept-Encoding')
      await caches.default.put(cacheKey, toCache.clone())

      const out = new Response(toCache.body, toCache)
      out.headers.set('X-Relay-Cache', 'MISS')
      out.headers.set('X-Relay-Cache-Key', target.toString())
      // Remove Cache-Control on client response per request
      out.headers.delete('Cache-Control')
      const colo = (c.req.raw as any)?.cf?.colo
      if (colo) out.headers.set('X-Relay-PoP', String(colo))
      return out
    }
  }

  // Non-cacheable or no-cache path; still expose key and PoP for diagnostics
  const out = new Response(resp.body, resp)
  if (isCacheable && cacheKey) {
    out.headers.set('X-Relay-Cache-Key', target.toString())
  }
  const colo = (c.req.raw as any)?.cf?.colo
  // Remove Cache-Control on client response per request
  out.headers.delete('Cache-Control')
  if (colo) out.headers.set('X-Relay-PoP', String(colo))
  return out
}

// Handle both /douban/frodo and /douban/frodo/* when mounted
frodo.all('/', proxyFrodo)
frodo.all('/*', proxyFrodo)

export default frodo
