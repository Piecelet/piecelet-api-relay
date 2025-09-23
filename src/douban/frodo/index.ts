import { makeProxyRouter } from '@/_lib/proxy'

const frodo = makeProxyRouter({
  stripPrefix: '/douban/frodo',
  upstreamBase: 'https://frodo.douban.com/api',
  injectQuery: (params, c) => {
    params.set('apiKey', c.env.DOUBAN_FRODO_KEY)
  },
  headerMutator: (headers) => {
    headers.set('Referer', 'https://servicewechat.com/wx2f9b06c1de1ccfca/99/page-frame.html')
    headers.set(
      'User-Agent',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Windows WindowsWechat/WMPF XWEB/8391'
    )
    headers.set('Accept-Language', 'zh-CN,zh;q=0.9,en;q=0.8')
    // Random Douban bid cookie per request
    const genBid = (len = 11) => {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-'
      const bytes = new Uint8Array(len)
      crypto.getRandomValues(bytes)
      let out = ''
      for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length]
      return out
    }
    headers.set('Cookie', `bid=${genBid()}`)
  },
  requiredEnv: ['DOUBAN_FRODO_KEY'],
  cache: {
    enabled: true,
    ttl2xx: 1800,
    ttl404: 60,
    addDebugHeaders: true,
    removeClientCacheControl: true,
  },
})

export default frodo
