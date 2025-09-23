import { makeProxyRouter } from '../_lib/proxy'

const metacritic = makeProxyRouter({
  stripPrefix: '/metacritic',
  upstreamBase: 'https://ee.iva-api.com/api/Metacritic',
  headerMutator: (headers, c) => {
    headers.set('ocp-apim-subscription-key', c.env.METACRITIC_KEY)
    headers.set('user-agent', 'METACRITIC_UA_REDACTED')
  },
  requiredEnv: ['METACRITIC_KEY'],
  cache: {
    enabled: true,
    ttl2xx: 1800,
    ttl404: 60,
    addDebugHeaders: true,
    removeClientCacheControl: true,
  },
})

export default metacritic
