import { Hono } from 'hono'
import { supabase } from '../supabase.js'
import { readImage } from '../tokens.js'

export const imageRoutes = new Hono()

imageRoutes.get('/:token', async (c) => {
  const image = readImage(decodeURIComponent(c.req.param('token')))
  if (!image) return c.json({ error: 'Invalid image' }, 404)

  const { data, error } = await supabase.storage.from('images').download(image.path)
  if (error || !data) return c.json({ error: 'Image not found' }, 404)

  const bytes = new Uint8Array(await data.arrayBuffer())
  const type = image.path.endsWith('.png')
    ? 'image/png'
    : image.path.endsWith('.webp')
      ? 'image/webp'
      : 'application/octet-stream'

  return c.body(bytes, 200, {
    'Content-Type': type,
    'Cache-Control': 'private, max-age=86400',
  })
})
