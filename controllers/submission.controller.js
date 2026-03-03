/**
 * Submission Controller
 * Handles task submission endpoints
 */

const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { hashToken, clean } = require('../utils/helpers');
const { CAUSE_CATEGORIES } = require('../config/constants');

/**
 * POST /api/tasks/:token/submit
 * Submit task completion report
 */
function submitTask(req, res) {
  const tokenHash = hashToken(req.params.token);
  const causeCategory = clean(req.body.cause_category);
  const causeDetail = clean(req.body.cause_detail);
  const visitLat = parseFloat(req.body.visit_lat) || null;
  const visitLng = parseFloat(req.body.visit_lng) || null;
  const recommendation = clean(req.body.recommendation);

  if (causeCategory && !CAUSE_CATEGORIES.includes(causeCategory)) {
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
}

module.exports = {
  submitTask
};
