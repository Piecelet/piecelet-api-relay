import { Hono } from 'hono'
import type { Env } from './_lib/proxy'
import metacritic from './metacritic/index'
import frodo from './douban/frodo/index'
import tmdb from './tmdb/index'

const app = new Hono<{ Bindings: Env }>()

// Health/root
app.get('/', (c) => c.text('Hello Piecelet API Relay!'))

// Mount the Metacritic relay under /metacritic
app.route('/metacritic', metacritic)

// Mount the Douban Frodo relay under /douban/frodo
app.route('/douban/frodo', frodo)

// Mount the TMDB relay under /tmdb
app.route('/tmdb', tmdb)

export default app
