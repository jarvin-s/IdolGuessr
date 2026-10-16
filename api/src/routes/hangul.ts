import { Hono } from 'hono'
import { nextHangul } from '../idols.js'

export const hangulRoutes = new Hono()

hangulRoutes.post('/next', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const groupFilter =
    body.groupFilter === 'boy-group' || body.groupFilter === 'girl-group'
      ? body.groupFilter
      : null
  const excludeIds = Array.isArray(body.excludeIds)
    ? body.excludeIds.filter((value: unknown) => typeof value === 'number')
    : []
  const idols = await nextHangul({
    count: Number(body.count) || 5,
    groupFilter,
    excludeIds,
  })
  return c.json({ idols })
})
