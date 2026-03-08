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
  const total = db.prepare(`SELECT COUNT(*) as count FROM cases`).get().count;
  const inProgress = db.prepare(`SELECT COUNT(*) as count FROM cases WHERE status = 'IN_PROGRESS'`).get().count;
  const pendingReview = db.prepare(`SELECT COUNT(*) as count FROM cases WHERE status = 'PENDING_REVIEW'`).get().count;
  const resolved = db.prepare(`SELECT COUNT(*) as count FROM cases WHERE status = 'RESOLVED'`).get().count;
  const activeDelegations = db.prepare(`SELECT COUNT(*) as count FROM task_links WHERE status = 'ACTIVE' AND COALESCE(admin_locked, 0) = 0`).get().count;
  const totalDelegations = db.prepare(`SELECT COUNT(*) as count FROM task_links WHERE delegation_depth > 0`).get().count;

  const createdToday = db.prepare(`SELECT COUNT(*) as count FROM cases WHERE date(created_at) = date('now')`).get().count;

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
