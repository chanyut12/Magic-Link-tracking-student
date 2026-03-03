/**
 * Delegation Controller
 * Handles task delegation endpoints
 */

const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const db = require('../db/database');
const { hashToken, generateToken, clean, getBaseUrl } = require('../utils/helpers');
const { MAX_EXPIRY_HOURS, DEFAULT_EXPIRY_HOURS } = require('../config/constants');

/**
 * POST /api/tasks/:token/delegate
 * Delegate a task to another person
 */
async function delegateTask(req, res) {
  const tokenHash = hashToken(req.params.token);
  const newAssigneeName = clean(req.body.new_assignee_name);
  const newAssigneePhone = clean(req.body.new_assignee_phone);
  const delegateHours = Math.min(parseInt(req.body.expires_in_hours) || DEFAULT_EXPIRY_HOURS, MAX_EXPIRY_HOURS);

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
}

module.exports = {
  delegateTask
};
