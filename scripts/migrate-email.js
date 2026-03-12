const db = require('../db/database');

console.log('Migrating task_links to include Email column...');

try {
  db.exec(`ALTER TABLE task_links ADD COLUMN assigned_to_email TEXT;`);
  console.log('Migration successful: Added assigned_to_email to task_links.');
} catch (err) {
  if (err.message.includes('duplicate column name')) {
    console.log('Column already exists, skipping.');
  } else {
    console.error('Migration failed:', err.message);
  }
}

process.exit(0);
