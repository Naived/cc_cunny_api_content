// app.js
require('dotenv').config();
const Hapi = require('@hapi/hapi');
const learningMaterialsRoutes = require('./routes/learningMaterialsRoutes');
const pool = require('./config/database');

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 9000,
    host: '0.0.0.0',
    routes: {
      cors: {
        origin: ['*'], // 🔐 Lock this down in production to your frontend domain
      },
    },
  });

  // Home Route
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

  // Dynamic Routes with /api prefix
  server.route(
    learningMaterialsRoutes.map(route => ({
      ...route,
      path: `/api${route.path}`,
    }))
  );

  // Centralized Error Handler
  server.ext('onPreResponse', (request, h) => {
    const { response } = request;
    if (response.isBoom) {
      console.error('❌ API Error:', response.output.payload);
      return h
        .response({
          status: 'error',
          message: response.message || 'Internal Server Error',
        })
        .code(response.output.statusCode);
    }
    return h.continue;
  });

  // Test DB Connection
  try {
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL connected via Railway');
  } catch (err) {
    console.error('⛔ DB connection failed:', err.message);
    // Do NOT exit, keep app running on Railway
  }

  await server.start();
  console.log(`🚀 Server live at ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

init();