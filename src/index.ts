import { Hono } from 'hono'

const app = new Hono()

// Health/root
app.get('/', (c) => c.text('Hello Hono!'))

// Internal proxy handler used for both /metacritic and /metacritic/*
const proxyMetacritic = async (c: import('hono').Context) => {
  const incomingUrl = new URL(c.req.url)

  // Compute target URL: https://ee.iva-api.com/api/Metacritic/* + original query
  const suffix = incomingUrl.pathname.replace(/^\/metacritic\/?/, '')
  const base = 'https://ee.iva-api.com/api/Metacritic'
  const target = new URL(base + (suffix ? `/${suffix}` : ''))
  target.search = incomingUrl.search

  // Build headers, inject required key and user agent
  const headers = new Headers(c.req.headers)
  // Ensure we do not pass along hop-by-hop or restricted headers
  headers.delete('host')
  headers.delete('content-length')
  headers.set('ocp-apim-subscription-key', 'METACRITIC_KEY_REDACTED')
  headers.set('user-agent', 'METACRITIC_UA_REDACTED')

  // Forward request preserving method and (if present) body
  const method = c.req.method
  const hasBody = !['GET', 'HEAD'].includes(method)
  const reqInit: RequestInit = {
    method,
    headers,
    body: hasBody ? c.req.raw.body : undefined,
  }

  const resp = await fetch(target.toString(), reqInit)
  return resp
}

// Relay all requests under /metacritic and /metacritic/* to IVA's Metacritic API
app.all('/metacritic', proxyMetacritic)
app.all('/metacritic/*', proxyMetacritic)

export default app
