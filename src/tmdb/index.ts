import { makeProxyRouter } from '../_lib/proxy'

const tmdb = makeProxyRouter({
  stripPrefix: '/tmdb',
  upstreamBase: 'https://api.themoviedb.org',
  headerMutator: (headers, c) => {
    headers.set('accept', 'application/json')
    headers.set('authorization', `Bearer ${c.env.TMDB_KEY}`)
  },
  requiredEnv: ['TMDB_KEY'],
  cache: {
    enabled: true,
    ttl2xx: 1800,
    ttl404: 60,
    addDebugHeaders: true,
    removeClientCacheControl: true,
  },
})

export default tmdb
