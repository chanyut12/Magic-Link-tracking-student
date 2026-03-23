import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../../.env') });

async function main() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '12345678',
    database: process.env.DB_NAME || 'sts',
  });

  try {
    await client.connect();
    console.log('Connected to database to fix default.');

    // 1. Change default to '{}'
    await client.query(`
      ALTER TABLE public.users ALTER COLUMN data_scope SET DEFAULT '{}'::jsonb;
    `);
    
    // 2. Update existing rows to '{}' if they are '[]' or null (just in case)
    await client.query(`
      UPDATE public.users SET data_scope = '{}'::jsonb WHERE data_scope IS NULL OR data_scope::text = '[]';
    `);

    console.log('Fixed default and updated existing rows for data_scope.');

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

main();
