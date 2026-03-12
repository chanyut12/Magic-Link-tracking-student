const db = require('./database');

db.exec(`
  CREATE TABLE IF NOT EXISTS cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_name TEXT NOT NULL,
    student_school TEXT,
    student_address TEXT,
    student_subdistrict TEXT,
    student_district TEXT,
    student_province TEXT,
    student_zipcode TEXT,
    student_lat REAL,
    student_lng REAL,
    reason_flagged TEXT,
    status TEXT DEFAULT 'OPEN',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
    task_type TEXT DEFAULT 'VISIT', -- VISIT, ATTENDANCE
    target_grade TEXT,
    target_room TEXT,
    status TEXT DEFAULT 'PENDING',
    max_delegation_depth INTEGER DEFAULT 3,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS task_links (
    id TEXT PRIMARY KEY,
    task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
    parent_link_id TEXT REFERENCES task_links(id),
    token_hash TEXT NOT NULL UNIQUE,
    magic_link TEXT,
    delegation_depth INTEGER DEFAULT 0,
    assigned_to_name TEXT,
    assigned_to_phone TEXT,
    status TEXT DEFAULT 'ACTIVE',
    admin_locked INTEGER DEFAULT 0,
    admin_lock_reason TEXT,
    admin_lock_at TEXT,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS task_submissions (
    id TEXT PRIMARY KEY,
    task_link_id TEXT REFERENCES task_links(id),
    visit_lat REAL,
    visit_lng REAL,
    cause_category TEXT,
    cause_detail TEXT,
    photo_paths TEXT,
    recommendation TEXT,
    submitted_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS case_reviews (
    id TEXT PRIMARY KEY,
    case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
    review_action TEXT NOT NULL, -- ASSIST, FORWARD, CLOSE
    review_note TEXT,
    reviewed_by TEXT,
    reviewed_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    school TEXT,
    grade TEXT, -- ม.1, ม.2, ...
    room TEXT,  -- 1, 2, 3, ...
    avatar_url TEXT,
    total_late INTEGER DEFAULT 0,
    total_absent INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS attendance_records (
    id TEXT PRIMARY KEY,
    student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
    status TEXT NOT NULL, -- P_PRESENT, P_LATE, P_ABSENT
    check_date TEXT DEFAULT (date('now','localtime')),
    created_at TEXT DEFAULT (datetime('now','localtime')),
    UNIQUE(student_id, check_date)
  );

  CREATE INDEX IF NOT EXISTS idx_task_links_token ON task_links(token_hash);
  CREATE INDEX IF NOT EXISTS idx_task_links_task_id ON task_links(task_id);
  CREATE INDEX IF NOT EXISTS idx_task_links_status ON task_links(status);
  CREATE INDEX IF NOT EXISTS idx_case_reviews_case_id ON case_reviews(case_id);
  CREATE INDEX IF NOT EXISTS idx_case_reviews_reviewed_at ON case_reviews(reviewed_at);
  CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON attendance_records(student_id);
  CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records(check_date);
`);

// Seed students if table is empty
const row = db.prepare('SELECT COUNT(*) as count FROM students').get();
if (row.count === 0) {
  const insert = db.prepare('INSERT INTO students (id, name, school, grade, room, avatar_url, total_late, total_absent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const sampleStudents = [
    ['6401023', 'กิตติพิสุทธิ์ จันทรศรี', 'โรงเรียนบ้านหนองบัว', 'ม.1', '1', '', 2, 1],
    ['6401024', 'ณัฐชยา เลิศจิรเกษม', 'โรงเรียนสตรีวิทยา', 'ม.1', '1', '', 1, 0],
    ['6401025', 'อรชยา สิงห์เอกสุวรรณ', 'โรงเรียนมัธยมวัดด่านเกลือ', 'ม.1', '2', '', 1, 1],
    ['6401026', 'ณัฐพล สิทธิบุศย์', 'โรงเรียนวัดท่าเรือ', 'ม.2', '1', '', 2, 0],
    ['6401027', 'ธนภัทร ไคลภูมิ', 'โรงเรียนบ้านดอนจั่น', 'ม.2', '2', '', 0, 1],
    ['6401028', 'ธนกร นนลือชา', 'โรงเรียนบ้านท่าตูม', 'ม.3', '1', '', 0, 2],
    ['6401029', 'มานะ อดทน', 'โรงเรียนสาธิต', 'ม.1', '1', '', 0, 0],
    ['6401030', 'วิชิต มีชัย', 'โรงเรียนสาธิต', 'ม.1', '1', '', 0, 0]
  ];
  
  const transaction = db.transaction((students) => {
    for (const s of students) insert.run(s);
  });
  transaction(sampleStudents);
  console.log('Seed students added.');
}

console.log('Database initialized successfully.');
process.exit(0);
