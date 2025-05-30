// database.js
require('dotenv').config(); // Load environment variables
const mysql = require('mysql2/promise'); // Import mysql2-promise
const { Pool } = require('pg'); // Import pg

const isPostgres = process.env.DB_TYPE === 'postgres'; // Check if using PostgreSQL
const isCloud = process.env.NODE_ENV === 'production'; // Check if running in Cloud

let pool;

if (isPostgres) {
  // Configuration for PostgreSQL
  pool = new Pool({
    host: isCloud ? undefined : process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
    ...(isCloud && {
      connectionString: process.env.DB_SOCKET_PATH, // Use DB_SOCKET_PATH as the connection string
      ssl: { rejectUnauthorized: false }, // Optional SSL configuration
    }),
  });
} else {
  // Konfigurasi untuk MySQL
  pool = mysql.createPool({
    host: isCloud ? process.env.DB_SOCKET_PATH : process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ...(isCloud && { socketPath: process.env.DB_SOCKET_PATH }),
  });
}

module.exports = pool;