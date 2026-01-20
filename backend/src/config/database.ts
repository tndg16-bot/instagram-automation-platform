import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const poolConfig: PoolConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'instaflow',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const pool = new Pool(poolConfig);

export default pool;

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};
