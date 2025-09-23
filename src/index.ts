import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env } from '@/_lib/types/env'
import metacritic from '@/metacritic'
import frodo from '@/douban/frodo'
import tmdb from '@/tmdb'
import omdb from '@/omdb'

const app = new Hono<{ Bindings: Env }>()

// Allow all CORS
app.use('*', cors())

// Health/root
app.get('/', (c) => c.text('Hello Piecelet API Relay!'))

// Mount the Metacritic relay under /metacritic
app.route('/metacritic', metacritic)

// Mount the Douban Frodo relay under /douban/frodo
app.route('/douban/frodo', frodo)

// Mount the TMDB relay under /tmdb
app.route('/tmdb', tmdb)

// Mount the OMDB relay under /omdb
app.route('/omdb', omdb)

export default app
