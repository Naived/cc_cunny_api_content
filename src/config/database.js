require('dotenv').config();
const { Pool } = require('pg');

const isPostgres = process.env.DATABASE_TYPE === 'postgres';
const isCloud = process.env.NODE_ENV === 'production';

let pool;

if (isPostgres) {
  if (process.env.DB_SOCKET_PATH) {
    // Socket connection (for GCP mostly)
    pool = new Pool({
      connectionString: process.env.DB_SOCKET_PATH,
      ssl: { rejectUnauthorized: false },
    });
  } else if (process.env.DATABASE_URL) {
    // Use the full connection string (correct usage)
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isCloud ? { rejectUnauthorized: false } : false,
    });
  } else {
    // Fallback to individual connection params if no DATABASE_URL
    pool = new Pool({
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT || 5432,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      ssl: isCloud ? { rejectUnauthorized: false } : false,
    });
  }
} else {
  throw new Error('Currently, only Postgres configuration is supported.');
}

module.exports = pool;