const db = require('../db/database');

console.log('--- Migrating: Add subject to task_links ---');

try {
    db.prepare(`ALTER TABLE task_links ADD COLUMN subject TEXT`).run();
    console.log('✅ Added subject column to task_links');
} catch (err) {
    if (err.message.includes('duplicate column name')) {
        console.log('ℹ️  Column subject already exists');
    } else {
        console.error('❌ Migration failed:', err.message);
    }
}

console.log('--- Creating Mock Schedules Table ---');

db.prepare(`
    CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        grade TEXT,
        room TEXT,
        day_of_week TEXT,
        start_time TEXT,
        end_time TEXT,
        subject_name TEXT,
        teacher_name TEXT
    )
`).run();

// Seed some mock data if empty
const count = db.prepare('SELECT COUNT(*) as cnt FROM schedules').get().cnt;
if (count === 0) {
    const seed = db.prepare(`
        INSERT INTO schedules (grade, room, day_of_week, start_time, end_time, subject_name, teacher_name)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const mockData = [
        ['ม.1', '4', 'Monday', '08:30', '10:30', 'คณิตศาสตร์พื้นฐาน', 'ครูนัฐพล'],
        ['ม.1', '4', 'Monday', '10:30', '12:30', 'ภาษาไทย', 'ครูสมศรี'],
        ['ม.1', '4', 'Tuesday', '08:30', '09:30', 'ภาษาอังกฤษ', 'ครูจอห์น'],
        ['ม.1', '4', 'Wednesday', '13:30', '15:30', 'วิทยาศาสตร์', 'ครูวิชัย'],
        ['ม.1', '4', 'Thursday', '09:30', '11:30', 'สังคมศึกษา', 'ครูปราณี'],
        ['ม.1', '4', 'Friday', '14:30', '16:30', 'พละศึกษา', 'ครูสมเกียรติ']
    ];

    for (const row of mockData) {
        seed.run(...row);
    }
    console.log('✅ Seeded mock schedule data');
}

console.log('--- Done ---');
