/**
 * Case Controller
 * Handles case management endpoints
 */

const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { clean } = require('../utils/helpers');
const { REVIEW_ACTIONS } = require('../config/constants');

/**
 * GET /api/cases
 * Get all cases with related task information
 */
function getAllCases(req, res) {
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
}

/**
 * POST /api/cases/:caseId/review
 * Submit a review for a case
 */
function reviewCase(req, res) {
  const caseId = parseInt(req.params.caseId);
  const reviewAction = String(req.body.review_action || '').trim().toUpperCase();
  const reviewNote = clean(req.body.review_note);
  const reviewedBy = clean(req.body.reviewed_by) || 'ผอ.';

  if (!caseId) return res.status(400).json({ error: 'Invalid case id' });
  if (!REVIEW_ACTIONS.includes(reviewAction)) {
    return res.status(400).json({ error: `review_action must be ${REVIEW_ACTIONS.join(', ')}` });
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
}

/**
 * GET /api/cases/:caseId/reviews
 * Get all reviews for a case
 */
function getCaseReviews(req, res) {
  const caseId = parseInt(req.params.caseId);
  if (!caseId) return res.status(400).json({ error: 'Invalid case id' });
  const rows = db.prepare(`
    SELECT * FROM case_reviews
    WHERE case_id = ?
    ORDER BY datetime(reviewed_at) DESC
  `).all(caseId);
  res.json({ case_id: caseId, reviews: rows });
}

module.exports = {
  getAllCases,
  reviewCase,
  getCaseReviews
};
