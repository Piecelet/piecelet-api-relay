import { Hono } from 'hono'
import metacritic from './metacritic/index'
import frodo from './douban/frodo/index'

const app = new Hono()

// Health/root
app.get('/', (c) => c.text('Hello Piecelet API Relay!'))

// Mount the Metacritic relay under /metacritic
app.route('/metacritic', metacritic)

// Mount the Douban Frodo relay under /douban/frodo
app.route('/douban/frodo', frodo)

export default app
