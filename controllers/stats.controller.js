/**
 * Stats Controller
 * Handles statistics endpoints
 */

const db = require('../db/database');

/**
 * GET /api/stats
 * Get dashboard statistics
 */
function getStats(req, res) {
  const total = db.prepare(`SELECT COUNT(*) as count FROM cases c JOIN tasks t ON c.id = t.case_id WHERE t.task_type = 'VISIT'`).get().count;
  const inProgress = db.prepare(`SELECT COUNT(*) as count FROM cases c JOIN tasks t ON c.id = t.case_id WHERE c.status = 'IN_PROGRESS' AND t.task_type = 'VISIT'`).get().count;
  const pendingReview = db.prepare(`SELECT COUNT(*) as count FROM cases c JOIN tasks t ON c.id = t.case_id WHERE c.status = 'PENDING_REVIEW' AND t.task_type = 'VISIT'`).get().count;
  const resolved = db.prepare(`SELECT COUNT(*) as count FROM cases c JOIN tasks t ON c.id = t.case_id WHERE c.status = 'RESOLVED' AND t.task_type = 'VISIT'`).get().count;
  const activeDelegations = db.prepare(`SELECT COUNT(*) as count FROM task_links tl JOIN tasks t ON tl.task_id = t.id WHERE tl.status = 'ACTIVE' AND COALESCE(tl.admin_locked, 0) = 0 AND t.task_type = 'VISIT'`).get().count;
  const totalDelegations = db.prepare(`SELECT COUNT(*) as count FROM task_links tl JOIN tasks t ON tl.task_id = t.id WHERE tl.delegation_depth > 0 AND t.task_type = 'VISIT'`).get().count;

  const createdToday = db.prepare(`SELECT COUNT(*) as count FROM cases c JOIN tasks t ON c.id = t.case_id WHERE date(c.created_at) = date('now') AND t.task_type = 'VISIT'`).get().count;

  res.json({
    total,
    in_progress: inProgress,
    pending_review: pendingReview,
    resolved,
    active_delegations: activeDelegations,
    total_delegations: totalDelegations,
    created_today: createdToday
  });
}

module.exports = {
  getStats
};
