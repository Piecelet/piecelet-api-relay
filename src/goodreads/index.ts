import { makeProxyRouter } from '@/_lib/proxy'

const goodreads = makeProxyRouter({
    stripPrefix: '/goodreads',
    upstreamBase: 'https://www.goodreads.com',
    injectQuery: (params, c) => {
        params.set('key', c.env.GOODREADS_KEY)
    },
    requiredEnv: ['GOODREADS_KEY'],
    cache: {
        enabled: true,
        ttl2xx: 1800,
        ttl404: 60,
        addDebugHeaders: true,
        removeClientCacheControl: true,
    },
})

export default goodreads
