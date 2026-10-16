import { Hono } from 'hono'
import { currentDaily, dailyCount, todayGuessCount } from '../idols.js'

export const dailyRoutes = new Hono()

dailyRoutes.post('/current', async (c) => {
  const idol = await currentDaily()
  if (!idol) return c.json({ error: 'No daily found' }, 404)
  return c.json(idol)
})

dailyRoutes.get('/count', async (c) => {
  return c.json({ count: await dailyCount() })
})

dailyRoutes.get('/today-count', async (c) => {
  return c.json({ count: await todayGuessCount() })
})
