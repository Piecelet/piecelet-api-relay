import { Hono } from 'hono'
import metacritic from './metacritic/index'

const app = new Hono()

// Health/root
app.get('/', (c) => c.text('Hello Piecelet API Relay!'))

// Mount the Metacritic relay under /metacritic
app.route('/metacritic', metacritic)

export default app
