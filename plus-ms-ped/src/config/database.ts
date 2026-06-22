import { Pool } from "pg";

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "plus",
  password: process.env.DB_PASSWORD || "plus_secret",
  database: process.env.DB_NAME || "plus_ped",
  ssl:
    process.env.DB_SSLMODE === "require"
      ? { rejectUnauthorized: false }
      : false,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

export const dbPool = new Pool(dbConfig);

export const query = async (text: string, params?: unknown[]) => {
  return dbPool.query(text, params);
};

export const testDatabaseConnection = async () => {
  const client = await dbPool.connect();
  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
};
