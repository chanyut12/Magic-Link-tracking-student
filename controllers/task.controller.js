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
  const taskType = req.body.task_type || 'VISIT';
  const assignedName = clean(req.body.assigned_to_name);

  if (!assignedName) {
    return res.status(400).json({ error: 'assigned_to_name is required' });
  }

  const taskId = uuidv4();
  const token = generateToken();
  const tokenHash = hashToken(token);
  const linkId = uuidv4();
  const expiresHours = parseInt(req.body.expires_in_hours) || DEFAULT_EXPIRY_HOURS;
  const expiresAt = new Date(Date.now() + Math.min(expiresHours, MAX_EXPIRY_HOURS) * 60 * 60 * 1000).toISOString();
  const magicLink = `${getBaseUrl(req)}/task/${token}`;

  try {
    const createTx = db.transaction(() => {
      let caseId = null;

      if (taskType === 'VISIT') {
        const studentName = clean(req.body.student_name);
        if (!studentName) throw new Error('student_name is required for Field Visit');

        const caseResult = db.prepare(`
          INSERT INTO cases (student_name, student_school, student_address, student_lat, student_lng, reason_flagged)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          studentName,
          clean(req.body.student_school),
          clean(req.body.student_address),
          parseFloat(req.body.student_lat) || null,
          parseFloat(req.body.student_lng) || null,
          clean(req.body.reason_flagged)
        );
        caseId = caseResult.lastInsertRowid;
        db.prepare(`UPDATE cases SET status = 'IN_PROGRESS' WHERE id = ?`).run(caseId);
      }

      db.prepare(`
        INSERT INTO tasks (id, case_id, task_type, target_grade, target_room, status)
        VALUES (?, ?, ?, ?, ?, 'IN_PROGRESS')
      `).run(
        taskId,
        caseId,
        taskType,
        clean(req.body.target_grade) || null,
        clean(req.body.target_room) || null
      );

      db.prepare(`
        INSERT INTO task_links (id, task_id, parent_link_id, token_hash, magic_link, delegation_depth, assigned_to_name, assigned_to_phone, assigned_to_email, expires_at, subject)
        VALUES (?, ?, NULL, ?, ?, 0, ?, ?, ?, ?, ?)
      `).run(linkId, taskId, tokenHash, magicLink, assignedName, clean(req.body.assigned_to_phone), clean(req.body.assigned_to_email), expiresAt, clean(req.body.subject));
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
  } catch (err) {
    console.error('createTask error:', err);
    res.status(400).json({ error: err.message || 'Failed to create task' });
  }
}

/**
 * GET /api/tasks/:token
 * Get task details by token
 */
function getTaskByToken(req, res) {
  const tokenHash = hashToken(req.params.token);

  const link = db.prepare(`
    SELECT tl.*, t.task_type, t.target_grade, t.target_room, t.max_delegation_depth, t.status as task_status
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

  let result = {
    task_id: link.task_id,
    link_id: link.id,
    task_type: link.task_type,
    target_grade: link.target_grade,
    target_room: link.target_room,
    assigned_to_name: link.assigned_to_name,
    delegation_depth: link.delegation_depth,
    max_delegation_depth: link.max_delegation_depth,
    can_delegate: link.delegation_depth < link.max_delegation_depth,
    expires_at: link.expires_at,
    subject: link.subject
  };

  // Fetch mock schedule for this room
  if (link.task_type === 'ATTENDANCE') {
      result.schedule = db.prepare(`
          SELECT * FROM schedules 
          WHERE grade = ? AND room = ?
          ORDER BY day_of_week, start_time
      `).all(link.target_grade, link.target_room);
  }

  if (link.task_type === 'VISIT') {
    const caseData = db.prepare(`
      SELECT c.* FROM cases c
      JOIN tasks t ON t.case_id = c.id
      WHERE t.id = ?
    `).get(link.task_id);

    // If OTP is not verified, we mask/hide sensitive student info
    if (!link.otp_verified) {
        result.auth_required = true;
        result.student_name = maskName(caseData.student_name);
        result.student_school = maskName(caseData.student_school); // Mask school too for safety
        result.student_address = '*** (กรุณายืนยันตัวตน) ***';
        result.reason_flagged = '*** (กรุณายืนยันตัวตน) ***';
        result.student_lat = null;
        result.student_lng = null;
    } else {
        result.auth_required = false;
        result.student_name = maskName(caseData.student_name);
        result.student_school = caseData.student_school;
        result.student_address = caseData.student_address;
        result.student_lat = caseData.student_lat;
        result.student_lng = caseData.student_lng;
        result.reason_flagged = caseData.reason_flagged;
    }
  } else if (link.task_type === 'ATTENDANCE') {
      result.auth_required = link.otp_verified ? false : true;
  } else {
      result.auth_required = false;
  }

  res.json(result);
}

const emailService = require('../services/email.service');

/**
 * POST /api/tasks/:token/otp
 * Generate and "send" OTP
 */
async function requestOTP(req, res) {
  const tokenHash = hashToken(req.params.token);
  const link = db.prepare('SELECT id, assigned_to_phone, assigned_to_email FROM task_links WHERE token_hash = ?').get(tokenHash);

  if (!link) return res.status(404).json({ error: 'Link not found' });
  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

  db.prepare(`
    UPDATE task_links SET otp_code = ?, otp_expires_at = ?, otp_verified = 0 WHERE id = ?
  `).run(otp, expiresAt, link.id);

  try {
    if (link.assigned_to_email) {
        await emailService.sendOTP(link.assigned_to_email, otp);
    } else {
        return res.status(400).json({ error: 'No email found for this link' });
    }
    res.json({ message: 'OTP sent successfully', expires_at: expiresAt, method: 'EMAIL' });
  } catch (err) {
    console.error('Failed to send OTP:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
}

/**
 * POST /api/tasks/:token/verify
 * Verify OTP
 */
async function verifyOTP(req, res) {
  const tokenHash = hashToken(req.params.token);
  const { otp } = req.body;

  if (!otp) return res.status(400).json({ error: 'OTP is required' });

  const link = db.prepare(`
    SELECT id, otp_code, otp_expires_at FROM task_links WHERE token_hash = ?
  `).get(tokenHash);

  if (!link) return res.status(404).json({ error: 'Link not found' });

  if (link.otp_code !== otp) {
    return res.status(400).json({ error: 'Invalid OTP code' });
  }

  if (new Date(link.otp_expires_at) < new Date()) {
    return res.status(400).json({ error: 'OTP expired' });
  }

  db.prepare(`UPDATE task_links SET otp_verified = 1 WHERE id = ?`).run(link.id);

  res.json({ success: true, message: 'OTP verified successfully' });
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
    LEFT JOIN cases c ON c.id = t.case_id
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

  const reviews = task.case_id ? db.prepare(`
    SELECT * FROM case_reviews
    WHERE case_id = ?
    ORDER BY datetime(reviewed_at) DESC
  `).all(task.case_id) : [];

  res.json({
    task_id: task.id,
    case_id: task.case_id,
    task_type: task.task_type,
    target_grade: task.target_grade,
    target_room: task.target_room,
    student_name: task.student_name,
    student_school: task.student_school,
    reason_flagged: task.reason_flagged,
    task_status: task.status,
    case_status: task.case_status,
    chain,
    reviews
  });
}

/**
 * GET /api/tasks/:token/students
 * Guest access to student list (filtered by task class)
 */
function getTaskStudents(req, res) {
  const tokenHash = hashToken(req.params.token);
  const link = db.prepare(`
    SELECT tl.otp_verified, t.target_grade, t.target_room
    FROM task_links tl
    JOIN tasks t ON t.id = tl.task_id
    WHERE tl.token_hash = ?
  `).get(tokenHash);

  if (!link) return res.status(404).json({ error: 'Link not found' });
  if (!link.otp_verified) return res.status(403).json({ error: 'OTP verification required' });

  try {
    const students = db.prepare(`
      SELECT id, name, grade, room, avatar_url, total_late, total_absent 
      FROM students
      WHERE grade = ? AND room = ?
      ORDER BY name ASC
    `).all(link.target_grade, link.target_room);
    
    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, error: 'DB_ERROR' });
  }
}

/**
 * GET /api/tasks/:token/history
 * Guest access to check existing records for today
 */
function getTaskHistory(req, res) {
  const tokenHash = hashToken(req.params.token);
  const { date } = req.query;
  const link = db.prepare(`
    SELECT tl.otp_verified, t.target_grade, t.target_room
    FROM task_links tl
    JOIN tasks t ON t.id = tl.task_id
    WHERE tl.token_hash = ?
  `).get(tokenHash);

  if (!link) return res.status(404).json({ error: 'Link not found' });
  if (!link.otp_verified) return res.status(403).json({ error: 'OTP verification required' });

  try {
    const records = db.prepare(`
      SELECT s.id, ar.status
      FROM students s
      JOIN attendance_records ar ON s.id = ar.student_id
      WHERE s.grade = ? AND s.room = ? AND ar.check_date = ?
    `).all(link.target_grade, link.target_room, date);

    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, error: 'DB_ERROR' });
  }
}

/**
 * POST /api/tasks/:token/attendance
 * Guest access to submit attendance
 */
function submitTaskAttendance(req, res) {
  const tokenHash = hashToken(req.params.token);
  const { records } = req.body;
  const link = db.prepare(`
    SELECT tl.otp_verified, t.target_grade, t.target_room
    FROM task_links tl
    JOIN tasks t ON t.id = tl.task_id
    WHERE tl.token_hash = ?
  `).get(tokenHash);

  if (!link) return res.status(404).json({ error: 'Link not found' });
  if (!link.otp_verified) return res.status(403).json({ error: 'OTP verification required' });
  if (!records || !Array.isArray(records)) {
    return res.status(400).json({ success: false, error: 'INVALID_DATA' });
  }

  const today = new Date().toISOString().split('T')[0];
  
  try {
    const getExisting = db.prepare(`
      SELECT ar.status FROM attendance_records ar
      JOIN students s ON s.id = ar.student_id
      WHERE ar.student_id = ? AND ar.check_date = ? AND s.grade = ? AND s.room = ?
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
        const existing = getExisting.get(item.student_id, today, link.target_grade, link.target_room);
        
        if (existing) {
          if (existing.status === item.status) continue;
          if (existing.status === 'P_LATE') decLate.run(item.student_id);
          if (existing.status === 'P_ABSENT') decAbs.run(item.student_id);
          if (item.status === 'P_LATE') incLate.run(item.student_id);
          if (item.status === 'P_ABSENT') incAbs.run(item.student_id);
          updateRecord.run(item.status, item.student_id, today);
        } else {
          // Verify student belongs to this class before inserting
          const std = db.prepare('SELECT id FROM students WHERE id = ? AND grade = ? AND room = ?').get(item.student_id, link.target_grade, link.target_room);
          if (std) {
            insertRecord.run(uuidv4(), item.student_id, item.status, today);
            if (item.status === 'P_LATE') incLate.run(item.student_id);
            if (item.status === 'P_ABSENT') incAbs.run(item.student_id);
          }
        }
      }
    });

    transaction(records);

    // After success, mark the link as COMPLETED
    db.prepare(`UPDATE task_links SET status = 'COMPLETED' WHERE token_hash = ?`).run(tokenHash);

    res.json({ success: true, message: 'บันทึกสำเร็จและปิดงานเรียบร้อย' });
  } catch (err) {
    console.error('submitTaskAttendance error:', err);
    res.status(500).json({ success: false, error: 'DB_ERROR' });
  }
}

module.exports = {
  createTask,
  getTaskByToken,
  getTaskChain,
  requestOTP,
  verifyOTP,
  getTaskStudents,
  getTaskHistory,
  submitTaskAttendance
};
