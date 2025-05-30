// app.js
require('dotenv').config();
const Hapi = require('@hapi/hapi');
const learningMaterialsRoutes = require('./routes/learningMaterialsRoutes');

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 9000,
    host: '0.0.0.0', // 'localhost' or '0.0.0.0', // Allow Google App Engine to use any incoming requests
  });

  server.route({
    method: 'GET',
    path: '/',
    handler: () => {
      return {
        status: '✅ API is running',
        message: 'Welcome to CUNNY Content API',
      };
    },
  });
  
  server.route(learningMaterialsRoutes);

  await server.start();
  console.log(`Server running on ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});


init();
