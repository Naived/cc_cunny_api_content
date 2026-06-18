import { Hono } from 'hono'
import { getClient } from '../config/database.js'
import { requireAuth } from '../middleware/auth.js'

const router = new Hono()
router.use('/*', requireAuth)

function generateJoinCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'CUNNY-'
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

router.post('/classes', async (c) => {
  const firebaseUid = c.get('firebaseUid')
  const { name } = await c.req.json()
  let client
  try {
    client = getClient(c.env)
    await client.connect()
    const userResult = await client.query('SELECT id, role FROM users WHERE firebase_uid = $1', [firebaseUid])
    if (userResult.rows.length === 0) return c.json({ error: true, message: 'User not found' }, 404)
    const user = userResult.rows[0]
    if (user.role !== 'teacher') return c.json({ error: true, message: 'Only teachers can create classes' }, 403)
    const code = generateJoinCode()
    const classResult = await client.query(
      `INSERT INTO classes (name, owner_teacher_id, join_code) VALUES ($1, $2, $3) RETURNING *`,
      [name, user.id, code]
    )
    await client.query(
      `INSERT INTO class_members (class_id, user_id, role) VALUES ($1, $2, 'teacher')`,
      [classResult.rows[0].id, user.id]
    )
    return c.json({ error: false, class: classResult.rows[0] }, 201)
  } catch (err) {
    return c.json({ error: true, message: err.message }, 500)
  } finally {
    if (client) c.executionCtx.waitUntil(client.end())
  }
})

router.post('/classes/join', async (c) => {
  const firebaseUid = c.get('firebaseUid')
  const { join_code } = await c.req.json()
  let client
  try {
    client = getClient(c.env)
    await client.connect()
    const userResult = await client.query('SELECT id FROM users WHERE firebase_uid = $1', [firebaseUid])
    if (userResult.rows.length === 0) return c.json({ error: true, message: 'User not found' }, 404)
    const userId = userResult.rows[0].id
    const classResult = await client.query('SELECT id FROM classes WHERE join_code = $1', [join_code])
    if (classResult.rows.length === 0) return c.json({ error: true, message: 'Invalid join code' }, 404)
    const classId = classResult.rows[0].id
    await client.query(
      `INSERT INTO class_members (class_id, user_id, role) VALUES ($1, $2, 'student') ON CONFLICT DO NOTHING`,
      [classId, userId]
    )
    return c.json({ error: false, message: 'Joined class successfully' }, 200)
  } catch (err) {
    return c.json({ error: true, message: err.message }, 500)
  } finally {
    if (client) c.executionCtx.waitUntil(client.end())
  }
})

router.get('/classes', async (c) => {
  const firebaseUid = c.get('firebaseUid')
  let client
  try {
    client = getClient(c.env)
    await client.connect()
    const result = await client.query(
      `SELECT c.*, cm.role as membership_role FROM classes c
       JOIN class_members cm ON c.id = cm.class_id
       JOIN users u ON u.id = cm.user_id
       WHERE u.firebase_uid = $1
       ORDER BY c.created_at DESC`,
      [firebaseUid]
    )
    return c.json({ error: false, classes: result.rows }, 200)
  } catch (err) {
    return c.json({ error: true, message: err.message }, 500)
  } finally {
    if (client) c.executionCtx.waitUntil(client.end())
  }
})

router.get('/classes/:id/progress', async (c) => {
  const classId = c.req.param('id')
  const firebaseUid = c.get('firebaseUid')
  let client
  try {
    client = getClient(c.env)
    await client.connect()
    const teacherCheck = await client.query(
      `SELECT id FROM classes WHERE id = $1 AND owner_teacher_id = (SELECT id FROM users WHERE firebase_uid = $2)`,
      [classId, firebaseUid]
    )
    if (teacherCheck.rows.length === 0) return c.json({ error: true, message: 'Not authorized' }, 403)
    const roster = await client.query(
      `SELECT u.id, u.display_name, u.avatar_url,
              COUNT(p.id) as lessons_completed,
              COALESCE(SUM(p.score), 0) as total_score
       FROM class_members cm
       JOIN users u ON u.id = cm.user_id
       LEFT JOIN progress p ON p.user_id = u.id
       WHERE cm.class_id = $1 AND cm.role = 'student'
       GROUP BY u.id, u.display_name, u.avatar_url
       ORDER BY total_score DESC`,
      [classId]
    )
    return c.json({ error: false, roster: roster.rows }, 200)
  } catch (err) {
    return c.json({ error: true, message: err.message }, 500)
  } finally {
    if (client) c.executionCtx.waitUntil(client.end())
  }
})

router.post('/classes/:id/assignments', async (c) => {
  const classId = c.req.param('id')
  const firebaseUid = c.get('firebaseUid')
  const { lesson_slug, title, due_at } = await c.req.json()
  let client
  try {
    client = getClient(c.env)
    await client.connect()
    const teacherCheck = await client.query(
      `SELECT id FROM classes WHERE id = $1 AND owner_teacher_id = (SELECT id FROM users WHERE firebase_uid = $2)`,
      [classId, firebaseUid]
    )
    if (teacherCheck.rows.length === 0) return c.json({ error: true, message: 'Not authorized' }, 403)
    const result = await client.query(
      `INSERT INTO assignments (class_id, lesson_slug, title, due_at) VALUES ($1, $2, $3, $4) RETURNING *`,
      [classId, lesson_slug, title || '', due_at || null]
    )
    return c.json({ error: false, assignment: result.rows[0] }, 201)
  } catch (err) {
    return c.json({ error: true, message: err.message }, 500)
  } finally {
    if (client) c.executionCtx.waitUntil(client.end())
  }
})

router.get('/classes/:id/assignments', async (c) => {
  const classId = c.req.param('id')
  let client
  try {
    client = getClient(c.env)
    await client.connect()
    const result = await client.query(
      `SELECT * FROM assignments WHERE class_id = $1 ORDER BY due_at ASC NULLS LAST`,
      [classId]
    )
    return c.json({ error: false, assignments: result.rows }, 200)
  } catch (err) {
    return c.json({ error: true, message: err.message }, 500)
  } finally {
    if (client) c.executionCtx.waitUntil(client.end())
  }
})

export default router
