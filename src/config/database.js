import pg from 'pg';
const { Client } = pg;

export const getClient = (env) => {
  const connectionString = env.DATABASE?.connectionString || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(`❌ Database connection string not found. Please bind Hyperdrive or set DATABASE_URL.`);
  }

  // Use Client instead of Pool. Hyperdrive IS the connection pool.
  // Using pg.Pool on Cloudflare Workers hangs the process event loop.
  return new Client({
    connectionString,
  });
};