const db = require('../db/database');

/**
 * Script to clean up duplicate attendance records and recalculate student totals.
 */
function cleanup() {
  console.log('Starting attendance data cleanup...');

  try {
    // 1. Identify and delete duplicates (keeping the most recent for each student-date pair)
    db.exec(`
      DELETE FROM attendance_records 
      WHERE id NOT IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY student_id, check_date ORDER BY created_at DESC) as row_num
          FROM attendance_records
        ) WHERE row_num = 1
      )
    `);
    console.log('Cleaned up duplicate attendance records.');

    // 2. Recalculate totals for all students
    const students = db.prepare('SELECT id FROM students').all();
    
    const updateStmt = db.prepare(`
      UPDATE students 
      SET total_late = ?, total_absent = ? 
      WHERE id = ?
    `);

    const countStats = db.prepare(`
      SELECT 
        COUNT(CASE WHEN status = 'P_LATE' THEN 1 END) as late_count,
        COUNT(CASE WHEN status = 'P_ABSENT' THEN 1 END) as absent_count
      FROM attendance_records
      WHERE student_id = ?
    `);

    const transaction = db.transaction(() => {
      for (const student of students) {
        const stats = countStats.get(student.id);
        updateStmt.run(stats.late_count, stats.absent_count, student.id);
      }
    });

    transaction();
    console.log('Recalculated student totals (total_late, total_absent).');
    console.log('Cleanup complete.');
  } catch (err) {
    console.error('Cleanup error:', err);
  } finally {
    process.exit(0);
  }
}

cleanup();
