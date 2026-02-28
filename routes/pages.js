const express = require('express');
const path = require('path');
const router = express.Router();
const {
  getAdminKey,
  setAdminSessionCookie,
  clearAdminSessionCookie,
  requireAdminPage
} = require('../utils/admin-auth');

const viewsDir = path.join(__dirname, '..', 'views');

router.get('/admin-access', (req, res) => res.sendFile(path.join(viewsDir, 'admin-access.html')));

router.post('/admin-access', (req, res) => {
  const adminKey = String(req.body.admin_key || '');
  const expectedKey = getAdminKey();
  const nextPath = String(req.body.next || '/');
  if (!expectedKey) {
    return res.status(500).send('ADMIN_ACCESS_KEY is not configured');
  }
  if (adminKey !== expectedKey) {
    return res.redirect(`/admin-access?error=1&next=${encodeURIComponent(nextPath)}`);
  }
  setAdminSessionCookie(res, req);
  return res.redirect(nextPath.startsWith('/') ? nextPath : '/');
});

router.post('/admin-logout', (req, res) => {
  clearAdminSessionCookie(res, req);
  return res.redirect('/admin-access');
});

router.get('/', requireAdminPage, (req, res) => res.sendFile(path.join(viewsDir, 'dashboard.html')));
router.get('/create', requireAdminPage, (req, res) => res.sendFile(path.join(viewsDir, 'create-task.html')));
router.get('/task/:token', (req, res) => res.sendFile(path.join(viewsDir, 'task-view.html')));
router.get('/task/:token/delegate', (req, res) => res.sendFile(path.join(viewsDir, 'delegate.html')));
router.get('/task/:token/report', (req, res) => res.sendFile(path.join(viewsDir, 'report.html')));
router.get('/task/:token/success', (req, res) => res.sendFile(path.join(viewsDir, 'success.html')));
router.get('/task-detail/:taskId', requireAdminPage, (req, res) => res.sendFile(path.join(viewsDir, 'task-detail.html')));
router.get('/expired', (req, res) => res.sendFile(path.join(viewsDir, 'expired.html')));

module.exports = router;
