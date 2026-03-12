const db = require('../db/database');

console.log('Migrating task_links to include OTP columns...');

try {
  db.exec(`
    ALTER TABLE task_links ADD COLUMN otp_code TEXT;
    ALTER TABLE task_links ADD COLUMN otp_expires_at TEXT;
    ALTER TABLE task_links ADD COLUMN otp_verified INTEGER DEFAULT 0;
  `);
  console.log('Migration successful: Added otp_code, otp_expires_at, otp_verified to task_links.');
} catch (err) {
  if (err.message.includes('duplicate column name')) {
    console.log('Columns already exist, skipping.');
  } else {
    console.error('Migration failed:', err.message);
  }
}

// Also update tasks to allow VISIT or ATTENDANCE if not already handled by init.js
// (init.js already has it, but just in case for existing DBs)
try {
    db.exec(`ALTER TABLE tasks ADD COLUMN target_grade TEXT;`);
    db.exec(`ALTER TABLE tasks ADD COLUMN target_room TEXT;`);
} catch (e) {}

process.exit(0);
