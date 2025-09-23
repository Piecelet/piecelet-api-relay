import { makeProxyRouter } from '../_lib/proxy'

const metacritic = makeProxyRouter({
  stripPrefix: '/metacritic',
  upstreamBase: 'https://ee.iva-api.com/api/Metacritic',
  headerMutator: (headers) => {
    headers.set('ocp-apim-subscription-key', 'METACRITIC_KEY_REDACTED')
    headers.set('user-agent', 'METACRITIC_UA_REDACTED')
  },
  cache: {
    enabled: true,
    ttl2xx: 1800,
    ttl404: 60,
    addDebugHeaders: true,
    removeClientCacheControl: true,
  },
})

export default metacritic
