import { Hono } from 'hono'
import { nextUnlimited } from '../idols.js'

export const infiniteRoutes = new Hono()

infiniteRoutes.post('/next', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const groupFilter =
    body.groupFilter === 'boy-group' || body.groupFilter === 'girl-group'
      ? body.groupFilter
      : null
  const genFilter = Array.isArray(body.genFilter)
    ? body.genFilter.filter((value: unknown) => typeof value === 'number')
    : undefined
  const excludeIds = Array.isArray(body.excludeIds)
    ? body.excludeIds.filter((value: unknown) => typeof value === 'number')
    : []
  const idols = await nextUnlimited({
    count: Number(body.count) || 5,
    groupFilter,
    genFilter,
    excludeIds,
    maxGuesses: body.maxGuesses === 3 ? 3 : 6,
  })
  return c.json({ idols })
})
