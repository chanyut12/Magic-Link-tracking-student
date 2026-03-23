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
    console.log('Connected to database for migration.');

    // 1. Add data_scope column if not exists
    await client.query(`
      ALTER TABLE public.users 
      ADD COLUMN IF NOT EXISTS data_scope jsonb DEFAULT '[]'::jsonb;
    `);
    console.log('Added data_scope column to users table.');

    // 2. Check and insert STUDENT role
    const checkRole = await client.query("SELECT id FROM roles WHERE name = 'STUDENT'");
    if (checkRole.rows.length === 0) {
      // Get max ID to avoid conflict if any manual insertions happened
      const maxIdRes = await client.query("SELECT MAX(id) as max_id FROM roles");
      const nextId = (maxIdRes.rows[0].max_id || 0) + 1;
      await client.query("INSERT INTO roles (id, name, label) VALUES ($1, 'STUDENT', 'นักเรียน')", [nextId]);
      console.log('Inserted STUDENT role.');
    } else {
      console.log('STUDENT role already exists.');
    }

    // 3. Verify roles count or labels just in case
    const allRoles = await client.query("SELECT * FROM roles");
    console.log('Current Roles:', allRoles.rows);

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

main();
