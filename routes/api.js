/**
 * API Routes
 * Main API router that delegates to controllers
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const { requireAdminApi } = require('../utils/admin-auth');
const { getUploadsDir, ensureDir } = require('../utils/storage-paths');
const {
  MAX_FILE_SIZE,
  MAX_FILES_PER_UPLOAD,
  ALLOWED_FILE_TYPES,
  ALLOWED_FILE_EXTENSIONS
} = require('../config/constants');

// Controllers
const { getStats } = require('../controllers/stats.controller');
const { getAllCases, reviewCase, getCaseReviews } = require('../controllers/case.controller');
const { createTask, getTaskByToken, getTaskChain, requestOTP, verifyOTP, getTaskStudents, getTaskHistory, submitTaskAttendance } = require('../controllers/task.controller');
const { delegateTask } = require('../controllers/delegation.controller');
const { submitTask } = require('../controllers/submission.controller');
const { adminLockLink } = require('../controllers/admin.controller');
const { getStudentsSummary, saveAttendance } = require('../controllers/attendance.controller');

const router = express.Router();
const uploadsDir = getUploadsDir();
ensureDir(uploadsDir);

// File upload configuration
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  if (!ALLOWED_FILE_TYPES.includes(mimeType) || !ALLOWED_FILE_EXTENSIONS.includes(ext)) {
    return cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`), false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES_PER_UPLOAD
  }
});

// Stats endpoints
router.get('/stats', requireAdminApi, getStats);

// Case endpoints
router.get('/cases', requireAdminApi, getAllCases);
router.post('/cases/:caseId/review', requireAdminApi, reviewCase);
router.get('/cases/:caseId/reviews', requireAdminApi, getCaseReviews);

// Task endpoints
router.post('/tasks', requireAdminApi, createTask);
router.get('/tasks/:token', getTaskByToken);
router.get('/tasks/:token/students', getTaskStudents);
router.get('/tasks/:token/history', getTaskHistory);
router.post('/tasks/:token/attendance', submitTaskAttendance);
router.get('/tasks/:taskId/chain', requireAdminApi, getTaskChain);
router.post('/tasks/:token/otp', requestOTP);
router.post('/tasks/:token/verify', verifyOTP);

// Delegation endpoints
router.post('/tasks/:token/delegate', delegateTask);

// Submission endpoints
router.post('/tasks/:token/submit', upload.array('photos', MAX_FILES_PER_UPLOAD), submitTask);

// Admin endpoints
router.post('/task-links/:linkId/admin-lock', requireAdminApi, adminLockLink);

// Attendance endpoints
router.get('/attendance/students', requireAdminApi, getStudentsSummary);
router.post('/attendance', requireAdminApi, saveAttendance);
router.get('/attendance/history', requireAdminApi, require('../controllers/attendance.controller').getAttendanceHistory);
router.get('/attendance/stats', requireAdminApi, require('../controllers/attendance.controller').getAttendanceStats);

module.exports = router;
