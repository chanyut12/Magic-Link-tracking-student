const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const QRCode = require('qrcode');
const db = require('../db/database');
const { requireAdminApi } = require('../utils/admin-auth');
const { getUploadsDir, ensureDir } = require('../utils/storage-paths');

const router = express.Router();
const uploadsDir = getUploadsDir();
ensureDir(uploadsDir);

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024, files: 5 } });

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function maskName(name) {
  if (!name) return name;
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    const prefix = parts[0];
    const firstName = parts[1];
    const masked = firstName.length > 2
      ? firstName.slice(0, 2) + '****'
      : firstName + '****';
    return prefix + ' ' + masked;
  }
  if (name.length <= 2) return name;
  return name.slice(0, 2) + '****';
}

function sanitize(str) {
  if (!str) return str;
  return String(str).replace(/[<>"'&]/g, c => ({
    '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;'
  })[c]);
}

function clean(str) {
  if (!str) return null;
  const s = String(str).trim();
  return s ? sanitize(s) : null;
}

function getBaseUrl(req) {
  const origin = req.headers.origin;
  if (origin) return String(origin).replace(/\/$/, '');

  const referer = req.headers.referer;
  if (referer) {
    try {
      const u = new URL(referer);
      return `${u.protocol}//${u.host}`;
    } catch (_) {
      // ignore invalid referer
    }
  }

  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const forwardedHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
  const proto = forwardedProto || req.protocol;
  const host = forwardedHost || req.get('host');
  return `${proto}://${host}`;
}

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

ensureBaseSchema();
ensureTaskLinkAdminColumns();

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

ensureCaseReviewsTable();

// GET /api/stats
router.get('/stats', requireAdminApi, (req, res) => {
  const total = db.prepare(`SELECT COUNT(*) as count FROM cases`).get().count;
  const open = db.prepare(`SELECT COUNT(*) as count FROM cases WHERE status = 'OPEN'`).get().count;
  const inProgress = db.prepare(`SELECT COUNT(*) as count FROM cases WHERE status = 'IN_PROGRESS'`).get().count;
  const pendingReview = db.prepare(`SELECT COUNT(*) as count FROM cases WHERE status = 'PENDING_REVIEW'`).get().count;
  const resolved = db.prepare(`SELECT COUNT(*) as count FROM cases WHERE status = 'RESOLVED'`).get().count;
  const activeDelegations = db.prepare(`SELECT COUNT(*) as count FROM task_links WHERE status = 'ACTIVE' AND COALESCE(admin_locked, 0) = 0`).get().count;
  const totalDelegations = db.prepare(`SELECT COUNT(*) as count FROM task_links WHERE delegation_depth > 0`).get().count;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const createdToday = db.prepare(`SELECT COUNT(*) as count FROM cases WHERE created_at >= ?`).get(todayStart.toISOString()).count;

  res.json({
    total,
    open,
    in_progress: inProgress,
    pending_review: pendingReview,
    resolved,
    active_delegations: activeDelegations,
    total_delegations: totalDelegations,
    created_today: createdToday
  });
});

// GET /api/cases
router.get('/cases', requireAdminApi, (req, res) => {
  const cases = db.prepare(`
    SELECT c.*, t.id as task_id, t.status as task_status,
      tl.id as active_link_id,
      tl.magic_link as active_link,
      tl.assigned_to_name as link_assigned_to,
      COALESCE(tl.admin_locked, 0) as active_link_locked,
      tl.admin_lock_reason as active_link_lock_reason,
      tl.admin_lock_at as active_link_lock_at,
      (
        SELECT cr.review_action
        FROM case_reviews cr
        WHERE cr.case_id = c.id
        ORDER BY datetime(cr.reviewed_at) DESC
        LIMIT 1
      ) as latest_review_action,
      (
        SELECT cr.review_note
        FROM case_reviews cr
        WHERE cr.case_id = c.id
        ORDER BY datetime(cr.reviewed_at) DESC
        LIMIT 1
      ) as latest_review_note,
      (
        SELECT cr.reviewed_by
        FROM case_reviews cr
        WHERE cr.case_id = c.id
        ORDER BY datetime(cr.reviewed_at) DESC
        LIMIT 1
      ) as latest_reviewed_by,
      (
        SELECT cr.reviewed_at
        FROM case_reviews cr
        WHERE cr.case_id = c.id
        ORDER BY datetime(cr.reviewed_at) DESC
        LIMIT 1
      ) as latest_reviewed_at
    FROM cases c
    LEFT JOIN tasks t ON t.case_id = c.id
    LEFT JOIN task_links tl ON tl.task_id = t.id AND tl.status = 'ACTIVE'
    ORDER BY c.created_at DESC
  `).all();
  res.json(cases);
});

// POST /api/tasks
router.post('/tasks', requireAdminApi, async (req, res) => {
  const studentName = clean(req.body.student_name);
  const assignedName = clean(req.body.assigned_to_name);

  if (!studentName || !assignedName) {
    return res.status(400).json({ error: 'student_name and assigned_to_name are required' });
  }

  const studentSchool = clean(req.body.student_school);
  const studentAddress = clean(req.body.student_address);
  const studentLat = parseFloat(req.body.student_lat) || null;
  const studentLng = parseFloat(req.body.student_lng) || null;
  const reasonFlagged = clean(req.body.reason_flagged);
  const assignedPhone = clean(req.body.assigned_to_phone);
  const expiresHours = parseInt(req.body.expires_in_hours) || 24;

  const caseInsert = db.prepare(`
    INSERT INTO cases (student_name, student_school, student_address, student_lat, student_lng, reason_flagged)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const caseResult = caseInsert.run(studentName, studentSchool, studentAddress, studentLat, studentLng, reasonFlagged);
  const caseId = caseResult.lastInsertRowid;

  const taskId = uuidv4();
  db.prepare(`INSERT INTO tasks (id, case_id) VALUES (?, ?)`).run(taskId, caseId);

  const token = generateToken();
  const tokenHash = hashToken(token);
  const linkId = uuidv4();
  const expiresAt = new Date(Date.now() + Math.min(expiresHours, 2160) * 60 * 60 * 1000).toISOString();

  const magicLink = `${getBaseUrl(req)}/task/${token}`;

  db.prepare(`
    INSERT INTO task_links (id, task_id, parent_link_id, token_hash, magic_link, delegation_depth, assigned_to_name, assigned_to_phone, expires_at)
    VALUES (?, ?, NULL, ?, ?, 0, ?, ?, ?)
  `).run(linkId, taskId, tokenHash, magicLink, assignedName, assignedPhone, expiresAt);

  db.prepare(`UPDATE cases SET status = 'IN_PROGRESS' WHERE id = ?`).run(caseId);
  db.prepare(`UPDATE tasks SET status = 'IN_PROGRESS' WHERE id = ?`).run(taskId);
  let qrDataUrl;
  try {
    qrDataUrl = await QRCode.toDataURL(magicLink, { width: 300, margin: 2 });
  } catch { qrDataUrl = null; }

  res.status(201).json({
    task_id: taskId,
    magic_link: magicLink,
    qr_code_data: qrDataUrl,
    expires_at: expiresAt
  });
});

// GET /api/tasks/:token
router.get('/tasks/:token', (req, res) => {
  const tokenHash = hashToken(req.params.token);

  const link = db.prepare(`
    SELECT tl.*, t.max_delegation_depth, t.status as task_status
    FROM task_links tl
    JOIN tasks t ON t.id = tl.task_id
    WHERE tl.token_hash = ?
  `).get(tokenHash);

  if (!link) return res.status(404).json({ error: 'Link not found' });

  if (new Date(link.expires_at) < new Date()) {
    return res.status(410).json({ error: 'Link expired', status: 'EXPIRED' });
  }

  if (link.admin_locked) {
    return res.status(403).json({
      error: 'Link is disabled by admin',
      status: 'ADMIN_LOCKED',
      reason: link.admin_lock_reason || null
    });
  }

  if (link.status === 'COMPLETED') {
    return res.status(403).json({ error: 'Task already completed', status: 'COMPLETED' });
  }

  if (link.status === 'DELEGATED') {
    return res.status(403).json({ error: 'Task already delegated', status: 'DELEGATED' });
  }

  const caseData = db.prepare(`
    SELECT c.* FROM cases c
    JOIN tasks t ON t.case_id = c.id
    WHERE t.id = ?
  `).get(link.task_id);

  res.json({
    task_id: link.task_id,
    link_id: link.id,
    assigned_to_name: link.assigned_to_name,
    delegation_depth: link.delegation_depth,
    max_delegation_depth: link.max_delegation_depth,
    can_delegate: link.delegation_depth < link.max_delegation_depth,
    expires_at: link.expires_at,
    student_name: maskName(caseData.student_name),
    student_school: caseData.student_school,
    student_address: caseData.student_address,
    student_lat: caseData.student_lat,
    student_lng: caseData.student_lng,
    reason_flagged: caseData.reason_flagged
  });
});

// POST /api/tasks/:token/delegate
router.post('/tasks/:token/delegate', async (req, res) => {
  const tokenHash = hashToken(req.params.token);
  const newAssigneeName = clean(req.body.new_assignee_name);
  const newAssigneePhone = clean(req.body.new_assignee_phone);
  const delegateHours = Math.min(parseInt(req.body.expires_in_hours) || 24, 2160);

  if (!newAssigneeName) {
    return res.status(400).json({ error: 'new_assignee_name is required' });
  }

  const link = db.prepare(`
    SELECT tl.*, t.max_delegation_depth
    FROM task_links tl
    JOIN tasks t ON t.id = tl.task_id
    WHERE tl.token_hash = ?
  `).get(tokenHash);

  if (!link) return res.status(404).json({ error: 'Link not found' });
  if (new Date(link.expires_at) < new Date()) return res.status(410).json({ error: 'Link expired' });
  if (link.status !== 'ACTIVE') return res.status(403).json({ error: 'Link is no longer active' });
  if (link.admin_locked) return res.status(403).json({ error: 'Link is disabled by admin' });
  if (link.delegation_depth >= link.max_delegation_depth) {
    return res.status(400).json({ error: 'Max delegation depth reached' });
  }

  const newToken = generateToken();
  const newTokenHash = hashToken(newToken);
  const newLinkId = uuidv4();
  const expiresAt = new Date(Date.now() + delegateHours * 60 * 60 * 1000).toISOString();

  const magicLink = `${getBaseUrl(req)}/task/${newToken}`;

  const delegateTx = db.transaction(() => {
    db.prepare(`UPDATE task_links SET status = 'DELEGATED' WHERE id = ?`).run(link.id);
    db.prepare(`
      INSERT INTO task_links (id, task_id, parent_link_id, token_hash, magic_link, delegation_depth, assigned_to_name, assigned_to_phone, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(newLinkId, link.task_id, link.id, newTokenHash, magicLink, link.delegation_depth + 1, newAssigneeName, newAssigneePhone, expiresAt);
  });
  delegateTx();
  let qrDataUrl;
  try {
    qrDataUrl = await QRCode.toDataURL(magicLink, { width: 300, margin: 2 });
  } catch { qrDataUrl = null; }

  res.status(201).json({
    magic_link: magicLink,
    qr_code_data: qrDataUrl,
    expires_at: expiresAt,
    delegation_depth: link.delegation_depth + 1
  });
});

// POST /api/tasks/:token/submit
router.post('/tasks/:token/submit', upload.array('photos', 5), (req, res) => {
  const tokenHash = hashToken(req.params.token);
  const validCategories = ['POVERTY', 'ILLNESS', 'FAMILY_ISSUE', 'TRANSPORTATION', 'OTHER'];
  const causeCategory = clean(req.body.cause_category);
  const causeDetail = clean(req.body.cause_detail);
  const visitLat = parseFloat(req.body.visit_lat) || null;
  const visitLng = parseFloat(req.body.visit_lng) || null;
  const recommendation = clean(req.body.recommendation);

  if (causeCategory && !validCategories.includes(causeCategory)) {
    return res.status(400).json({ error: 'Invalid cause_category' });
  }

  const link = db.prepare(`
    SELECT tl.* FROM task_links tl WHERE tl.token_hash = ?
  `).get(tokenHash);

  if (!link) return res.status(404).json({ error: 'Link not found' });
  if (new Date(link.expires_at) < new Date()) return res.status(410).json({ error: 'Link expired' });
  if (link.status !== 'ACTIVE') return res.status(403).json({ error: 'Link is no longer active' });
  if (link.admin_locked) return res.status(403).json({ error: 'Link is disabled by admin' });

  const photoPaths = (req.files || []).map(f => `/uploads/${f.filename}`);
  const submissionId = uuidv4();

  const submitTx = db.transaction(() => {
    db.prepare(`
      INSERT INTO task_submissions (id, task_link_id, visit_lat, visit_lng, cause_category, cause_detail, photo_paths, recommendation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(submissionId, link.id, visitLat, visitLng, causeCategory, causeDetail, JSON.stringify(photoPaths), recommendation);

    db.prepare(`UPDATE task_links SET status = 'COMPLETED' WHERE id = ?`).run(link.id);
    db.prepare(`UPDATE tasks SET status = 'COMPLETED' WHERE id = ?`).run(link.task_id);
    db.prepare(`UPDATE cases SET status = 'PENDING_REVIEW' WHERE id = (SELECT case_id FROM tasks WHERE id = ?)`).run(link.task_id);
  });
  submitTx();

  res.json({ message: 'Report submitted successfully', submission_id: submissionId });
});

// POST /api/task-links/:linkId/admin-lock
router.post('/task-links/:linkId/admin-lock', requireAdminApi, (req, res) => {
  const { linkId } = req.params;
  const action = String(req.body.action || '').trim();
  const reason = clean(req.body.reason);

  if (!['lock', 'unlock'].includes(action)) {
    return res.status(400).json({ error: 'action must be lock or unlock' });
  }

  const link = db.prepare(`SELECT * FROM task_links WHERE id = ?`).get(linkId);
  if (!link) return res.status(404).json({ error: 'Link not found' });
  if (link.status !== 'ACTIVE') {
    return res.status(400).json({ error: 'Only ACTIVE links can be changed by admin' });
  }
  if (new Date(link.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Link already expired' });
  }

  if (action === 'lock') {
    if (!reason) return res.status(400).json({ error: 'reason is required when locking link' });
    db.prepare(`
      UPDATE task_links
      SET admin_locked = 1, admin_lock_reason = ?, admin_lock_at = ?
      WHERE id = ?
    `).run(reason, new Date().toISOString(), linkId);
    return res.json({ message: 'Link locked by admin', link_id: linkId, admin_locked: 1 });
  }

  db.prepare(`
    UPDATE task_links
    SET admin_locked = 0, admin_lock_reason = NULL, admin_lock_at = NULL
    WHERE id = ?
  `).run(linkId);
  return res.json({ message: 'Link unlocked by admin', link_id: linkId, admin_locked: 0 });
});

// POST /api/cases/:caseId/review
router.post('/cases/:caseId/review', requireAdminApi, (req, res) => {
  const caseId = parseInt(req.params.caseId);
  const reviewAction = String(req.body.review_action || '').trim().toUpperCase();
  const reviewNote = clean(req.body.review_note);
  const reviewedBy = clean(req.body.reviewed_by) || 'ผอ.';
  const validActions = ['ASSIST', 'FORWARD', 'CLOSE'];

  if (!caseId) return res.status(400).json({ error: 'Invalid case id' });
  if (!validActions.includes(reviewAction)) {
    return res.status(400).json({ error: 'review_action must be ASSIST, FORWARD, or CLOSE' });
  }

  const caseRow = db.prepare(`SELECT * FROM cases WHERE id = ?`).get(caseId);
  if (!caseRow) return res.status(404).json({ error: 'Case not found' });
  if (caseRow.status !== 'PENDING_REVIEW' && caseRow.status !== 'IN_PROGRESS') {
    return res.status(400).json({ error: 'Case is not in reviewable status' });
  }

  const reviewId = uuidv4();
  const reviewedAt = new Date().toISOString();
  const nextStatus = reviewAction === 'CLOSE' ? 'RESOLVED' : 'IN_PROGRESS';

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO case_reviews (id, case_id, review_action, review_note, reviewed_by, reviewed_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(reviewId, caseId, reviewAction, reviewNote, reviewedBy, reviewedAt);
    db.prepare(`UPDATE cases SET status = ? WHERE id = ?`).run(nextStatus, caseId);
  });
  tx();

  res.json({
    message: 'Case review saved',
    case_id: caseId,
    review_id: reviewId,
    review_action: reviewAction,
    case_status: nextStatus
  });
});

// GET /api/cases/:caseId/reviews
router.get('/cases/:caseId/reviews', requireAdminApi, (req, res) => {
  const caseId = parseInt(req.params.caseId);
  if (!caseId) return res.status(400).json({ error: 'Invalid case id' });
  const rows = db.prepare(`
    SELECT * FROM case_reviews
    WHERE case_id = ?
    ORDER BY datetime(reviewed_at) DESC
  `).all(caseId);
  res.json({ case_id: caseId, reviews: rows });
});

// GET /api/tasks/:taskId/chain
router.get('/tasks/:taskId/chain', requireAdminApi, (req, res) => {
  const { taskId } = req.params;

  const task = db.prepare(`
    SELECT t.*, c.student_name, c.student_school, c.reason_flagged, c.status as case_status
    FROM tasks t
    JOIN cases c ON c.id = t.case_id
    WHERE t.id = ?
  `).get(taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const links = db.prepare(`
    SELECT tl.* FROM task_links tl
    WHERE tl.task_id = ?
    ORDER BY tl.delegation_depth ASC
  `).all(taskId);

  const chain = links.map(link => {
    const submission = db.prepare(`SELECT * FROM task_submissions WHERE task_link_id = ?`).get(link.id);
    return { ...link, submission: submission || null };
  });

  const reviews = db.prepare(`
    SELECT * FROM case_reviews
    WHERE case_id = ?
    ORDER BY datetime(reviewed_at) DESC
  `).all(task.case_id);

  res.json({
    task_id: task.id,
    case_id: task.case_id,
    student_name: task.student_name,
    student_school: task.student_school,
    reason_flagged: task.reason_flagged,
    task_status: task.status,
    case_status: task.case_status,
    chain,
    reviews
  });
});

module.exports = router;
