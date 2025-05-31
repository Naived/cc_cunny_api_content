// database.js
require('dotenv').config(); // Load environment variables
const mysql = require('mysql2/promise'); // Import mysql2-promise
const { Pool } = require('pg'); // Import pg

const isPostgres = process.env.DB_TYPE === 'postgres'; // Check if using PostgreSQL
const isCloud = process.env.NODE_ENV === 'production'; // Check if running in Cloud

let pool;

if (isPostgres) {
  if (process.env.DB_SOCKET_PATH) {
    // Using socket connection (rare, mostly GCP SQL)
    pool = new Pool({
      connectionString: process.env.DB_SOCKET_PATH,
      ssl: { rejectUnauthorized: false },
    });
  } else {
    // Standard Supabase / Railway style
    pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: isCloud ? { rejectUnauthorized: false } : false, // Supabase/Railway require SSL in production
    });
  }
} else {
  // MySQL config
  pool = mysql.createPool({
    host: isCloud ? process.env.DB_SOCKET_PATH : process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ...(isCloud && { socketPath: process.env.DB_SOCKET_PATH }),
  });
}

module.exports = pool;