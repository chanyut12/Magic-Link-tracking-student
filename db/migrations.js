/**
 * Database Migrations
 * Handles schema creation and updates
 */

const db = require('./database');

/**
 * Initialize base schema for all tables
 */
function ensureBaseSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_name TEXT NOT NULL,
      student_school TEXT,
      student_address TEXT,
      student_lat REAL,
      student_lng REAL,
      reason_flagged TEXT,
      status TEXT DEFAULT 'OPEN',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
      task_type TEXT DEFAULT 'VISIT',
      target_grade TEXT,
      target_room TEXT,
      target_school_id INTEGER,
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
      review_action TEXT NOT NULL,
      review_note TEXT,
      reviewed_by TEXT,
      reviewed_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_task_links_token ON task_links(token_hash);
    CREATE INDEX IF NOT EXISTS idx_task_links_task_id ON task_links(task_id);
    CREATE INDEX IF NOT EXISTS idx_task_links_status ON task_links(status);
    CREATE INDEX IF NOT EXISTS idx_case_reviews_case_id ON case_reviews(case_id);
    CREATE INDEX IF NOT EXISTS idx_case_reviews_reviewed_at ON case_reviews(reviewed_at);
  `);
}

/**
 * Ensure admin lock columns exist in task_links table
 * Migration for admin lock feature
 */
function ensureTaskLinkAdminColumns() {
  const columns = db.prepare(`PRAGMA table_info(task_links)`).all();
  const names = new Set(columns.map(c => c.name));

  if (!names.has('admin_locked')) {
    db.exec(`ALTER TABLE task_links ADD COLUMN admin_locked INTEGER DEFAULT 0`);
  }
  if (!names.has('admin_lock_reason')) {
    db.exec(`ALTER TABLE task_links ADD COLUMN admin_lock_reason TEXT`);
  }
  if (!names.has('admin_lock_at')) {
    db.exec(`ALTER TABLE task_links ADD COLUMN admin_lock_at TEXT`);
  }
}

/**
 * Ensure case_reviews table exists
 * Migration for case review feature
 */
function ensureCaseReviewsTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS case_reviews (
      id TEXT PRIMARY KEY,
      case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
      review_action TEXT NOT NULL,
      review_note TEXT,
      reviewed_by TEXT,
      reviewed_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_case_reviews_case_id ON case_reviews(case_id);
    CREATE INDEX IF NOT EXISTS idx_case_reviews_reviewed_at ON case_reviews(reviewed_at);
  `);
}

/**
 * Migration: Add attendance-related columns to tasks and task_links
 */
function ensureAttendanceColumns() {
  // tasks table: task_type, target_grade, target_room
  const taskCols = db.prepare(`PRAGMA table_info(tasks)`).all();
  const taskNames = new Set(taskCols.map(c => c.name));

  if (!taskNames.has('task_type')) {
    db.exec(`ALTER TABLE tasks ADD COLUMN task_type TEXT DEFAULT 'VISIT'`);
  }
  if (!taskNames.has('target_grade')) {
    db.exec(`ALTER TABLE tasks ADD COLUMN target_grade TEXT`);
  }
  if (!taskNames.has('target_room')) {
    db.exec(`ALTER TABLE tasks ADD COLUMN target_room TEXT`);
  }
  if (!taskNames.has('target_school_id')) {
    db.exec(`ALTER TABLE tasks ADD COLUMN target_school_id INTEGER`);
  }

  // task_links table: assigned_to_email, otp_code, otp_expires_at, otp_verified, subject
  const linkCols = db.prepare(`PRAGMA table_info(task_links)`).all();
  const linkNames = new Set(linkCols.map(c => c.name));

  if (!linkNames.has('assigned_to_email')) {
    db.exec(`ALTER TABLE task_links ADD COLUMN assigned_to_email TEXT`);
  }
  if (!linkNames.has('otp_code')) {
    db.exec(`ALTER TABLE task_links ADD COLUMN otp_code TEXT`);
  }
  if (!linkNames.has('otp_expires_at')) {
    db.exec(`ALTER TABLE task_links ADD COLUMN otp_expires_at TEXT`);
  }
  if (!linkNames.has('otp_verified')) {
    db.exec(`ALTER TABLE task_links ADD COLUMN otp_verified INTEGER DEFAULT 0`);
  }
  if (!linkNames.has('subject')) {
    db.exec(`ALTER TABLE task_links ADD COLUMN subject TEXT`);
  }
}

/**
 * Migration: Add granular address columns to cases table
 */
function ensureCaseAddressColumns() {
  const cols = db.prepare(`PRAGMA table_info(cases)`).all();
  const names = new Set(cols.map(c => c.name));

  if (!names.has('student_subdistrict')) {
    db.exec(`ALTER TABLE cases ADD COLUMN student_subdistrict TEXT`);
  }
  if (!names.has('student_district')) {
    db.exec(`ALTER TABLE cases ADD COLUMN student_district TEXT`);
  }
  if (!names.has('student_province')) {
    db.exec(`ALTER TABLE cases ADD COLUMN student_province TEXT`);
  }
  if (!names.has('student_zipcode')) {
    db.exec(`ALTER TABLE cases ADD COLUMN student_zipcode TEXT`);
  }
}

/**
 * Migration: Create students and attendance tables
 */
function ensureAttendanceTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      school TEXT,
      grade TEXT,
      room TEXT,
      avatar_url TEXT,
      total_late INTEGER DEFAULT 0,
      total_absent INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY,
      student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      check_date TEXT DEFAULT (date('now','localtime')),
      created_at TEXT DEFAULT (datetime('now','localtime')),
      UNIQUE(student_id, check_date)
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grade TEXT,
      room TEXT,
      day_of_week INTEGER,
      subject TEXT,
      start_time TEXT,
      end_time TEXT,
      teacher TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON attendance_records(student_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records(check_date);
  `);
}

/**
 * Run all migrations
 * Call this on server startup to ensure database is up to date
 */
function runMigrations() {
  ensureBaseSchema();
  ensureTaskLinkAdminColumns();
  ensureCaseReviewsTable();
  ensureAttendanceColumns();
  ensureCaseAddressColumns();
  ensureAttendanceTables();
}

module.exports = {
  ensureBaseSchema,
  ensureTaskLinkAdminColumns,
  ensureCaseReviewsTable,
  ensureAttendanceColumns,
  ensureCaseAddressColumns,
  ensureAttendanceTables,
  runMigrations
};
