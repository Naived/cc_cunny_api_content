// config/database.js
const { Pool } = require('pg');

const isPostgres = process.env.DATABASE_TYPE === 'postgres';
const isCloud = process.env.NODE_ENV === 'production';

console.log('🔍 DATABASE_TYPE:', process.env.DATABASE_TYPE);
console.log('🌐 NODE_ENV:', process.env.NODE_ENV);

if (!isPostgres) {
  throw new Error(`❌ Only Postgres is supported. DATABASE_TYPE='${process.env.DATABASE_TYPE}'`);
}

let pool;

if (process.env.DATABASE_URL) {
  // Railway URL (recommended)
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isCloud ? { rejectUnauthorized: false } : false,
  });
} else {
  // Manual fallback
  pool = new Pool({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl: isCloud ? { rejectUnauthorized: false } : false,
  });
}

module.exports = pool;