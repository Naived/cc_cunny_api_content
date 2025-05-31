//database.js
const { Pool } = require('pg');

const isPostgres = process.env.DATABASE_URL?.startsWith('postgres');
const isCloud = process.env.NODE_ENV === 'production';

if (!isPostgres) {
  throw new Error(`❌ Invalid DATABASE_URL or not using PostgreSQL.`);
}

console.log('🔍 Using PostgreSQL via DATABASE_URL');
console.log('🌐 Environment:', process.env.NODE_ENV);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isCloud ? { rejectUnauthorized: false } : false,
});

module.exports = pool;