import { Hono } from 'hono'
import { getClient } from '../config/database.js'
import { requireAuth } from '../middleware/auth.js'

const router = new Hono()

router.post('/auth/register', requireAuth, async (c) => {
  const firebaseUid = c.get('firebaseUid')
  const { display_name, role } = await c.req.json()
  let client
  try {
    client = getClient(c.env)
    await client.connect()
    const result = await client.query(
      `INSERT INTO users (firebase_uid, display_name, role, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (firebase_uid)
       DO UPDATE SET display_name = $2, role = $3, updated_at = NOW()
       RETURNING *`,
      [firebaseUid, display_name || 'Student', role || 'student']
    )
    return c.json({ error: false, user: result.rows[0] }, 200)
  } catch (err) {
    return c.json({ error: true, message: err.message }, 500)
  } finally {
    if (client) c.executionCtx.waitUntil(client.end())
  }
})

router.get('/auth/me', requireAuth, async (c) => {
  const firebaseUid = c.get('firebaseUid')
  let client
  try {
    client = getClient(c.env)
    await client.connect()
    const result = await client.query('SELECT * FROM users WHERE firebase_uid = $1', [firebaseUid])
    if (result.rows.length === 0) {
      return c.json({ error: true, message: 'User not found. Register first.' }, 404)
    }
    return c.json({ error: false, user: result.rows[0] }, 200)
  } catch (err) {
    return c.json({ error: true, message: err.message }, 500)
  } finally {
    if (client) c.executionCtx.waitUntil(client.end())
  }
})

export default router
