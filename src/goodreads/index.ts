import { makeProxyRouter } from '@/_lib/proxy'

const goodreads = makeProxyRouter({
    stripPrefix: '/goodreads',
    upstreamBase: 'https://www.goodreads.com',
    injectQuery: (params, c) => {
        params.set('key', c.env.GOODREADS_KEY)
    },
    requiredEnv: ['GOODREADS_KEY'],
})

export default goodreads
