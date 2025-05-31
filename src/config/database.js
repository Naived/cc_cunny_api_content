const { Pool } = require('pg');

const isPostgres = process.env.DATABASE_TYPE === 'postgres';
const isCloud = process.env.NODE_ENV === 'production';

console.log('DATABASE_TYPE from env:', process.env.DATABASE_TYPE);  // Debug

let pool;

if (isPostgres) {
  if (process.env.DB_SOCKET_PATH) {
    pool = new Pool({
      connectionString: process.env.DB_SOCKET_PATH,
      ssl: { rejectUnauthorized: false },
    });
  } else if (process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isCloud ? { rejectUnauthorized: false } : false,
    });
  } else {
    pool = new Pool({
      host: process.env.DATABASE_HOST || 'db.biennddgojeyshruogja.supabase.co',
      port: process.env.DATABASE_PORT || 5432,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      ssl: isCloud ? { rejectUnauthorized: false } : false,
    });
  }
} else {
  throw new Error(`Currently, only Postgres configuration is supported. DATABASE_TYPE found: '${process.env.DATABASE_TYPE}'`);
}

module.exports = pool;