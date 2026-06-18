import { Hono } from 'hono'
import { getClient } from '../config/database.js'
import { requireAuth } from '../middleware/auth.js'

const router = new Hono()
router.use('/me/*', requireAuth)

router.get('/me/progress', async (c) => {
  const firebaseUid = c.get('firebaseUid')
  let client
  try {
    client = getClient(c.env)
    await client.connect()
    const userResult = await client.query('SELECT id FROM users WHERE firebase_uid = $1', [firebaseUid])
    if (userResult.rows.length === 0) return c.json({ error: true, message: 'User not found' }, 404)
    const userId = userResult.rows[0].id
    const progressResult = await client.query('SELECT * FROM progress WHERE user_id = $1 ORDER BY completed_at DESC', [userId])
    const badgesResult = await client.query('SELECT * FROM achievements WHERE user_id = $1', [userId])
    return c.json({
      error: false,
      progress: progressResult.rows,
      badges: badgesResult.rows,
    }, 200)
  } catch (err) {
    return c.json({ error: true, message: err.message }, 500)
  } finally {
    if (client) c.executionCtx.waitUntil(client.end())
  }
})

router.put('/me/progress', async (c) => {
  const firebaseUid = c.get('firebaseUid')
  const { lesson_slug, score } = await c.req.json()
  let client
  try {
    client = getClient(c.env)
    await client.connect()
    const userResult = await client.query('SELECT id FROM users WHERE firebase_uid = $1', [firebaseUid])
    if (userResult.rows.length === 0) return c.json({ error: true, message: 'User not found' }, 404)
    const userId = userResult.rows[0].id
    const result = await client.query(
      `INSERT INTO progress (user_id, lesson_slug, score, completed_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, lesson_slug)
       DO UPDATE SET score = GREATEST(progress.score, $3), completed_at = NOW()
       RETURNING *`,
      [userId, lesson_slug, score || 0]
    )
    return c.json({ error: false, progress: result.rows[0] }, 200)
  } catch (err) {
    return c.json({ error: true, message: err.message }, 500)
  } finally {
    if (client) c.executionCtx.waitUntil(client.end())
  }
})

export default router
