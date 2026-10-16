import { Hono } from 'hono'
import { historyByDate, historyDates } from '../idols.js'

export const historyRoutes = new Hono()

historyRoutes.get('/dates', async (c) => {
  return c.json(await historyDates())
})

historyRoutes.post('/by-date', async (c) => {
  const body = await c.req.json().catch(() => null)
  const date = body?.date
  if (typeof date !== 'string') return c.json({ error: 'Missing date' }, 400)
  const idol = await historyByDate(date)
  if (!idol) return c.json({ error: 'No idol for that date' }, 404)
  return c.json(idol)
})
