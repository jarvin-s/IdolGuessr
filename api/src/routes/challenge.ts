import { Hono } from 'hono'
import { supabase } from '../supabase.js'
import { asPublic, clearImageFor, type IdolRecord, type PublicIdol } from '../idols.js'

export const challengeRoutes = new Hono()

function toIdol(row: {
  id: number
  name: string
  alt_name?: string | null
  img_bucket: string
  group_category?: string | null
  base64_group?: string | null
  group_name?: string | null
}): IdolRecord {
  return {
    id: row.id,
    name: row.name,
    altName: row.alt_name ?? null,
    groupType: null,
    imgBucket: row.img_bucket,
    groupCategory: row.group_category ?? null,
    base64Group: row.base64_group ?? null,
    groupName: row.group_name ?? null,
    hangulName: null,
  }
}

async function loadChallenge(challengeId: string) {
  const { data, error } = await supabase.rpc('get_challenge', {
    p_challenge_id: challengeId,
  })
  if (error || !data?.length) return null
  return data[0] as {
    id: string
    idol_count: number
    group_filter: string
    created_at: string
    expires_at?: string
    idols: Array<{
      id: number
      name: string
      alt_name?: string | null
      img_bucket: string
      group_category?: string | null
      base64_group?: string | null
      group_name?: string | null
    }>
  }
}

challengeRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)
  const sessionId = body?.sessionId
  const idolCount = Number(body?.idolCount)
  const groupFilter = body?.groupFilter || 'both'
  if (typeof sessionId !== 'string' || !sessionId) {
    return c.json({ error: 'Missing session' }, 400)
  }
  if (![5, 10, 15, 20].includes(idolCount)) {
    return c.json({ error: 'Invalid idol count' }, 400)
  }
  const { data, error } = await supabase.rpc('create_challenge', {
    p_session_id: sessionId,
    p_idol_count: idolCount,
    p_group_filter: groupFilter,
  })
  if (error || !data) return c.json({ error: 'Could not create challenge' }, 500)
  return c.json({ id: data })
})

challengeRoutes.post('/play', async (c) => {
  const body = await c.req.json().catch(() => null)
  const challenge = await loadChallenge(body?.challengeId)
  if (!challenge) return c.json({ error: 'Challenge not found' }, 404)
  const idols = (challenge.idols || [])
    .map((row) => asPublic(toIdol(row), 'challenge', 6, challenge.id))
    .filter((idol): idol is PublicIdol => !!idol)
  return c.json({
    id: challenge.id,
    idol_count: challenge.idol_count,
    group_filter: challenge.group_filter,
    created_at: challenge.created_at,
    idols,
  })
})

challengeRoutes.post('/revealed', async (c) => {
  const body = await c.req.json().catch(() => null)
  const challenge = await loadChallenge(body?.challengeId)
  if (!challenge) return c.json({ error: 'Challenge not found' }, 404)
  const idols = (challenge.idols || []).map((row) => {
    const idol = toIdol(row)
    return {
      id: idol.id,
      name: idol.name,
      group_name: idol.groupName,
      img_bucket: `idol-${idol.id}`,
      clearImageUrl: clearImageFor(idol, 'challenge'),
    }
  })
  return c.json({
    id: challenge.id,
    idol_count: challenge.idol_count,
    group_filter: challenge.group_filter,
    created_at: challenge.created_at,
    idols,
  })
})

challengeRoutes.post('/results', async (c) => {
  const body = await c.req.json().catch(() => null)
  const { data, error } = await supabase.rpc('get_challenge_results', {
    p_challenge_id: body?.challengeId,
  })
  if (error) return c.json({ results: [] })
  return c.json({ results: data || [] })
})

challengeRoutes.post('/submit', async (c) => {
  const body = await c.req.json().catch(() => null)
  const { data, error } = await supabase.rpc('submit_challenge_result', {
    p_challenge_id: body?.challengeId,
    p_session_id: body?.sessionId,
    p_nickname: body?.nickname ?? null,
    p_results: body?.results ?? [],
    p_total_correct: body?.totalCorrect ?? 0,
  })
  if (error || !data) return c.json({ error: 'Could not submit' }, 500)
  return c.json({ id: data })
})

challengeRoutes.post('/played', async (c) => {
  const body = await c.req.json().catch(() => null)
  const { data, error } = await supabase
    .from('challenge_results')
    .select('id')
    .eq('challenge_id', body?.challengeId)
    .eq('session_id', body?.sessionId)
    .maybeSingle()
  if (error) return c.json({ played: false })
  return c.json({ played: data !== null })
})
