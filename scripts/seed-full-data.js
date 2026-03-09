const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Script to seed students for all grades/rooms and generate 10 days of history.
 */
async function seedFullData() {
  console.log('Starting full data seeding with new ID format...');

  try {
    // 1. Clean existing data
    db.exec('DELETE FROM attendance_records');
    db.exec('DELETE FROM students');
    console.log('Cleared existing student and attendance data.');

    const grades = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];
    const rooms = ['1', '2', '3', '4', '5', '6'];
    const dates = [
      '2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05',
      '2026-03-06', '2026-03-07', '2026-03-08', '2026-03-09', '2026-03-10'
    ];

    const insertStudent = db.prepare(`
      INSERT INTO students (id, name, school, grade, room, total_late, total_absent)
      VALUES (?, ?, ?, ?, ?, 0, 0)
    `);

    const insertAttendance = db.prepare(`
      INSERT INTO attendance_records (id, student_id, status, check_date)
      VALUES (?, ?, ?, ?)
    `);

    const updateTotals = db.prepare(`
      UPDATE students 
      SET total_late = (SELECT COUNT(*) FROM attendance_records WHERE student_id = students.id AND status = 'P_LATE'),
          total_absent = (SELECT COUNT(*) FROM attendance_records WHERE student_id = students.id AND status = 'P_ABSENT')
      WHERE id = ?
    `);

    const studentNames = [
      'กิตติพิสุทธิ์ จันทรศรี', 'ณัฐชยา เลิศจิรเกษม', 'อรชยา สิงห์เอกสุวรรณ', 'ณัฐพล สิทธิบุศย์', 
      'ธนภัทร ไคลภูมิ', 'ธนกร นนลือชา', 'มานะ อดทน', 'วิชิต มีชัย', 'สมชาย ใจดี', 'สมหญิง รักเรียน'
    ];

    let studentCount = 0;
    db.transaction(() => {
      for (const grade of grades) {
        for (const room of rooms) {
          // Generate 3 students per room
          for (let i = 1; i <= 3; i++) {
            studentCount++;
            // Format: 6616XXXX (0001, 0002, ...)
            const studentId = '6616' + studentCount.toString().padStart(4, '0');
            const name = studentNames[(studentCount % studentNames.length)] + ` (${grade}/${room})`;
            
            insertStudent.run(studentId, name, 'โรงเรียนสาธิต STS', grade, room);

            // Generate history for each student
            for (const date of dates) {
              const rand = Math.random();
              let status = 'P_PRESENT';
              if (rand > 0.92) status = 'P_ABSENT';
              else if (rand > 0.85) status = 'P_LATE';

              insertAttendance.run(uuidv4(), studentId, status, date);
            }
            
            // Re-calculate totals for this student
            updateTotals.run(studentId);
          }
        }
      }
    })();

    console.log(`Successfully seeded ${studentCount} students with 6616**** IDs and 10 days of history.`);
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    process.exit(0);
  }
}

seedFullData();
