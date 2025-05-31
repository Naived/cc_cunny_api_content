// app.js
require('dotenv').config();
const Hapi = require('@hapi/hapi');
const learningMaterialsRoutes = require('./routes/learningMaterialsRoutes');
const pool = require('./config/database');

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 9000,
    host: '0.0.0.0',
  });

  server.route({
    method: 'GET',
    path: '/',
    handler: () => ({
      status: '✅ API is running',
      message: 'Welcome to CUNNY Content API',
      routes: [
        'GET /api/learning-materials',
        'GET /api/learning-materials/{id}',
        'POST /api/learning-materials',
        'PUT /api/learning-materials/{id}',
        'DELETE /api/learning-materials/{id}',
      ],
    }),
  });

  server.route(
    learningMaterialsRoutes.map(route => ({
      ...route,
      path: `/api${route.path}`,
    }))
  );

  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected via Railway');
    client.release();
  } catch (err) {
    console.error('⛔ DB connection failed:', err.message);
    process.exit(1);
  }

  await server.start();
  console.log(`🚀 Server live at ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.error('🔥 Unhandled Rejection:', err);
  process.exit(1);
});

init();