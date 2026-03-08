/**
 * Admin Controller
 * Handles admin-specific endpoints
 */

const db = require('../db/database');
const { clean } = require('../utils/helpers');

/**
 * POST /api/task-links/:linkId/admin-lock
 * Lock or unlock a task link (admin only)
 */
function adminLockLink(req, res) {
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
}

module.exports = {
  adminLockLink
};
