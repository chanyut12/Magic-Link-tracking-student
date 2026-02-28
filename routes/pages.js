const express = require('express');
const path = require('path');
const router = express.Router();

const viewsDir = path.join(__dirname, '..', 'views');

router.get('/', (req, res) => res.sendFile(path.join(viewsDir, 'dashboard.html')));
router.get('/create', (req, res) => res.sendFile(path.join(viewsDir, 'create-task.html')));
router.get('/task/:token', (req, res) => res.sendFile(path.join(viewsDir, 'task-view.html')));
router.get('/task/:token/delegate', (req, res) => res.sendFile(path.join(viewsDir, 'delegate.html')));
router.get('/task/:token/report', (req, res) => res.sendFile(path.join(viewsDir, 'report.html')));
router.get('/task/:token/success', (req, res) => res.sendFile(path.join(viewsDir, 'success.html')));
router.get('/task-detail/:taskId', (req, res) => res.sendFile(path.join(viewsDir, 'task-detail.html')));
router.get('/expired', (req, res) => res.sendFile(path.join(viewsDir, 'expired.html')));

module.exports = router;
