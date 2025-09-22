import { Hono } from 'hono'

const frodo = new Hono()

const proxyFrodo = async (c: import('hono').Context) => {
  const incomingUrl = new URL(c.req.url)

  // Map /douban/frodo/<suffix> -> https://frodo.douban.com/api/<suffix>
  const suffix = incomingUrl.pathname.replace(/^\/douban\/frodo\/?/, '')
  const base = 'https://frodo.douban.com/api'
  const target = new URL(base + (suffix ? `/${suffix}` : ''))

  // Copy query params and inject/override apiKey
  const inParams = incomingUrl.searchParams
  inParams.forEach((v, k) => target.searchParams.set(k, v))
  target.searchParams.set('apiKey', 'DOUBAN_FRODO_KEY_REDACTED')

  // Forward headers (strip hop-by-hop)
  const headers = new Headers(c.req.headers)
  headers.delete('host')
  headers.delete('content-length')
  // Force required upstream-identifying headers
  headers.set('Referer', 'https://servicewechat.com/wx2f9b06c1de1ccfca/99/page-frame.html')
  headers.set(
    'User-Agent',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Windows WindowsWechat/WMPF XWEB/8391'
  )
  headers.set('Accept-Language', 'zh-CN,zh;q=0.9,en;q=0.8')

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

// Handle both /douban/frodo and /douban/frodo/* when mounted
frodo.all('/', proxyFrodo)
frodo.all('/*', proxyFrodo)

export default frodo
