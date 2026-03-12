const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Get students list with attendance summary
 */
exports.getStudentsSummary = (req, res) => {
  try {
    const students = db.prepare(`
      SELECT 
        id, 
        name, 
        school, 
        grade,
        room,
        avatar_url, 
        total_late, 
        total_absent 
      FROM students
      ORDER BY name ASC
    `).all();
    
    res.json({ success: true, data: students });
  } catch (err) {
    console.error('getStudentsSummary error:', err);
    res.status(500).json({ success: false, error: 'DB_ERROR' });
  }
};

/**
 * Save attendance records and update student totals
 */
exports.saveAttendance = (req, res) => {
  const { records } = req.body;
  if (!records || !Array.isArray(records)) {
    return res.status(400).json({ success: false, error: 'INVALID_DATA' });
  }

  const today = new Date().toISOString().split('T')[0];
  
  try {
    const getExisting = db.prepare(`
      SELECT status FROM attendance_records 
      WHERE student_id = ? AND check_date = ?
    `);

    const updateRecord = db.prepare(`
      UPDATE attendance_records SET status = ? 
      WHERE student_id = ? AND check_date = ?
    `);

    const insertRecord = db.prepare(`
      INSERT INTO attendance_records (id, student_id, status, check_date) 
      VALUES (?, ?, ?, ?)
    `);

    const decLate = db.prepare('UPDATE students SET total_late = MAX(0, total_late - 1) WHERE id = ?');
    const incLate = db.prepare('UPDATE students SET total_late = total_late + 1 WHERE id = ?');
    const decAbs = db.prepare('UPDATE students SET total_absent = MAX(0, total_absent - 1) WHERE id = ?');
    const incAbs = db.prepare('UPDATE students SET total_absent = total_absent + 1 WHERE id = ?');

    const transaction = db.transaction((data) => {
      for (const item of data) {
        const existing = getExisting.get(item.student_id, today);
        
        if (existing) {
          // If status hasn't changed, skip
          if (existing.status === item.status) continue;

          // Undo old status effect on totals
          if (existing.status === 'P_LATE') decLate.run(item.student_id);
          if (existing.status === 'P_ABSENT') decAbs.run(item.student_id);
          
          // Apply new status effect on totals
          if (item.status === 'P_LATE') incLate.run(item.student_id);
          if (item.status === 'P_ABSENT') incAbs.run(item.student_id);

          // Update record
          updateRecord.run(item.status, item.student_id, today);
        } else {
          // New record
          insertRecord.run(uuidv4(), item.student_id, item.status, today);
          
          // Apply new status effect
          if (item.status === 'P_LATE') incLate.run(item.student_id);
          if (item.status === 'P_ABSENT') incAbs.run(item.student_id);
        }
      }
    });

    transaction(records);
    res.json({ success: true, message: 'บันทึกสำเร็จ' });
  } catch (err) {
    console.error('saveAttendance error:', err);
    res.status(500).json({ success: false, error: 'DB_ERROR' });
  }
};

/**
 * Get attendance records for a specific date
 */
exports.getAttendanceHistory = (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ success: false, error: 'DATE_REQUIRED' });

  try {
    const records = db.prepare(`
      SELECT 
        s.id, s.name, s.grade, s.room, s.avatar_url, ar.status, ar.check_date
      FROM students s
      LEFT JOIN attendance_records ar ON s.id = ar.student_id AND ar.check_date = ?
      ORDER BY s.name ASC
    `).all(date);

    res.json({ success: true, data: records });
  } catch (err) {
    console.error('getAttendanceHistory error:', err);
    res.status(500).json({ success: false, error: 'DB_ERROR' });
  }
};

/**
 * Get attendance stats for a specific date
 */
exports.getAttendanceStats = (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ success: false, error: 'DATE_REQUIRED' });

  try {
    const stats = db.prepare(`
      SELECT 
        status, COUNT(*) as count 
      FROM attendance_records 
      WHERE check_date = ? 
      GROUP BY status
    `).all(date);

    const totalStudents = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
    
    res.json({ success: true, data: { stats, totalStudents } });
  } catch (err) {
    console.error('getAttendanceStats error:', err);
    res.status(500).json({ success: false, error: 'DB_ERROR' });
  }
};
