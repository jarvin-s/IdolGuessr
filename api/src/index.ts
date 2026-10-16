import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { apiPublicUrl, corsOrigins, port } from './env.js'
import { clientIp, rateLimit } from './rateLimit.js'
import { hintFor, submitGuess, viewSession } from './idols.js'
import { dailyRoutes } from './routes/daily.js'
import { historyRoutes } from './routes/history.js'
import { infiniteRoutes } from './routes/infinite.js'
import { hangulRoutes } from './routes/hangul.js'
import { challengeRoutes } from './routes/challenge.js'
import { imageRoutes } from './routes/images.js'

const app = new Hono()

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return corsOrigins[0] || '*'
      return corsOrigins.includes(origin) ? origin : corsOrigins[0]
    },
    allowMethods: ['GET', 'POST', 'OPTIONS'],
  })
)

app.get('/health', (c) => c.json({ ok: true }))

app.route('/daily', dailyRoutes)
app.route('/history', historyRoutes)
app.route('/infinite', infiniteRoutes)
app.route('/hangul', hangulRoutes)
app.route('/challenge', challengeRoutes)
app.route('/images', imageRoutes)

app.post('/guess', async (c) => {
  const ip = clientIp(c.req.header('x-forwarded-for'))
  if (!rateLimit(`guess:${ip}`, 40, 60_000)) {
    return c.json({ error: 'Too many guesses' }, 429)
  }
  const body = await c.req.json().catch(() => null)
  if (!body?.session || typeof body.guess !== 'string') {
    return c.json({ error: 'Missing guess' }, 400)
  }
  const result = await submitGuess(body.session, body.guess)
  if (!result) return c.json({ error: 'Invalid session' }, 400)
  return c.json(result)
})

app.post('/hint', async (c) => {
  const ip = clientIp(c.req.header('x-forwarded-for'))
  if (!rateLimit(`hint:${ip}`, 30, 60_000)) {
    return c.json({ error: 'Too many hints' }, 429)
  }
  const body = await c.req.json().catch(() => null)
  if (!body?.session) return c.json({ error: 'Missing session' }, 400)
  const groupName = await hintFor(body.session)
  if (!groupName) return c.json({ error: 'No hint' }, 404)
  return c.json({ groupName })
})

app.post('/session', async (c) => {
  const body = await c.req.json().catch(() => null)
  if (!body?.session) return c.json({ error: 'Missing session' }, 400)
  const idol = await viewSession(body.session)
  if (!idol) return c.json({ error: 'Invalid session' }, 400)
  return c.json(idol)
})

serve({ fetch: app.fetch, port }, () => {
  console.log(`IdolGuessr API listening on ${apiPublicUrl}`)
})
