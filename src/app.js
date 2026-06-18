// app.js
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import learningMaterialsRoutes from './routes/learningMaterialsRoutes.js';
import lessonsRoutes from './routes/lessonsRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import authRoutes from './routes/authRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import classRoutes from './routes/classRoutes.js';
import { runMigration } from './migrate.js';

const app = new Hono();

app.use('*', cors({
  origin: '*',
}));

app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({ status: 'error', message: err.message || 'Internal Server Error' }, 500);
});

app.get('/', (c) => {
  return c.json({
    status: 'API is running on Cloudflare Workers',
    message: 'Welcome to CUNNY Content API',
    routes: [
      'GET /api/learning-materials',
      'GET /api/learning-materials/:id',
      'POST /api/learning-materials',
      'PUT /api/learning-materials/:id',
      'DELETE /api/learning-materials/:id',
      'GET /api/categories?language=id',
      'GET /api/courses?category=ai&language=id',
      'GET /api/courses/:slug/lessons?language=id',
      'GET /api/lessons?language=id',
      'GET /api/lessons/:slug?language=id',
      'POST /api/lessons',
      'PUT /api/lessons/:slug',
      'DELETE /api/lessons/:slug',
      'POST /api/auth/register',
      'GET /api/auth/me',
      'GET /api/me/progress',
      'PUT /api/me/progress',
      'POST /api/classes',
      'POST /api/classes/join',
      'GET /api/classes',
      'GET /api/classes/:id/progress',
      'POST /api/classes/:id/assignments',
      'GET /api/classes/:id/assignments',
      'GET /api/migrate',
    ],
  });
});

app.get('/api/migrate', async (c) => {
  const result = await runMigration(c);
  if (result.ok) return c.json({ error: false, message: 'Migration complete' }, 200);
  return c.json({ error: true, message: result.error }, 500);
});

app.route('/api', learningMaterialsRoutes);
app.route('/api', lessonsRoutes);
app.route('/api', courseRoutes);
app.route('/api', authRoutes);
app.route('/api', progressRoutes);
app.route('/api', classRoutes);

export default app;
