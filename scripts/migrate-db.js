const db = require('../db/database');

/**
 * Migration script to add missing columns to tasks and students tables.
 */
function migrate() {
  console.log('Starting database migration...');

  try {
    // Helper to check if a column exists
    const columnExists = (table, column) => {
      const info = db.prepare(`PRAGMA table_info(${table})`).all();
      return info.some(col => col.name === column);
    };

    // Add columns to tasks table
    if (!columnExists('tasks', 'task_type')) {
      db.exec("ALTER TABLE tasks ADD COLUMN task_type TEXT DEFAULT 'VISIT'");
      console.log('Added task_type to tasks table.');
    }
    if (!columnExists('tasks', 'target_grade')) {
      db.exec("ALTER TABLE tasks ADD COLUMN target_grade TEXT");
      console.log('Added target_grade to tasks table.');
    }
    if (!columnExists('tasks', 'target_room')) {
      db.exec("ALTER TABLE tasks ADD COLUMN target_room TEXT");
      console.log('Added target_room to tasks table.');
    }
    if (!columnExists('tasks', 'target_school_id')) {
      db.exec("ALTER TABLE tasks ADD COLUMN target_school_id INTEGER");
      console.log('Added target_school_id to tasks table.');
    }

    // Add columns to students table
    if (!columnExists('students', 'grade')) {
      db.exec("ALTER TABLE students ADD COLUMN grade TEXT");
      console.log('Added grade to students table.');
    }
    if (!columnExists('students', 'room')) {
      db.exec("ALTER TABLE students ADD COLUMN room TEXT");
      console.log('Added room to students table.');
    }

    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
