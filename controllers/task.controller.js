/**
 * Task Controller
 * Handles task creation and retrieval endpoints
 */

const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const db = require('../db/database');
const { hashToken, generateToken, maskName, clean, getBaseUrl } = require('../utils/helpers');
const { MAX_EXPIRY_HOURS, DEFAULT_EXPIRY_HOURS } = require('../config/constants');

/**
 * POST /api/tasks
 * Create a new task and initial task link
 */
async function createTask(req, res) {
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
  const expiresHours = parseInt(req.body.expires_in_hours) || DEFAULT_EXPIRY_HOURS;

  const taskId = uuidv4();
  const token = generateToken();
  const tokenHash = hashToken(token);
  const linkId = uuidv4();
  const expiresAt = new Date(Date.now() + Math.min(expiresHours, MAX_EXPIRY_HOURS) * 60 * 60 * 1000).toISOString();
  const magicLink = `${getBaseUrl(req)}/task/${token}`;

  const createTx = db.transaction(() => {
    const caseResult = db.prepare(`
      INSERT INTO cases (student_name, student_school, student_address, student_lat, student_lng, reason_flagged)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(studentName, studentSchool, studentAddress, studentLat, studentLng, reasonFlagged);
    const caseId = caseResult.lastInsertRowid;

    db.prepare(`INSERT INTO tasks (id, case_id) VALUES (?, ?)`).run(taskId, caseId);

    db.prepare(`
      INSERT INTO task_links (id, task_id, parent_link_id, token_hash, magic_link, delegation_depth, assigned_to_name, assigned_to_phone, expires_at)
      VALUES (?, ?, NULL, ?, ?, 0, ?, ?, ?)
    `).run(linkId, taskId, tokenHash, magicLink, assignedName, assignedPhone, expiresAt);

    db.prepare(`UPDATE cases SET status = 'IN_PROGRESS' WHERE id = ?`).run(caseId);
    db.prepare(`UPDATE tasks SET status = 'IN_PROGRESS' WHERE id = ?`).run(taskId);
  });
  createTx();

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
}

/**
 * GET /api/tasks/:token
 * Get task details by token
 */
function getTaskByToken(req, res) {
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
}

/**
 * GET /api/tasks/:taskId/chain
 * Get full task delegation chain
 */
function getTaskChain(req, res) {
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
}

module.exports = {
  createTask,
  getTaskByToken,
  getTaskChain
};
