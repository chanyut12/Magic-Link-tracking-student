/**
 * Application Constants
 * Centralized configuration for magic numbers and limits
 */

module.exports = {
  // Time limits (in hours)
  MAX_EXPIRY_HOURS: 2160, // 90 days
  DEFAULT_EXPIRY_HOURS: 24,

  // File upload limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_UPLOAD: 5,
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'],
  ALLOWED_FILE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],

  // Admin session
  ADMIN_SESSION_HOURS: 8,
  ADMIN_COOKIE_NAME: 'sts_admin_session',

  // Task and case statuses
  CASE_STATUS: {
    OPEN: 'OPEN',
    IN_PROGRESS: 'IN_PROGRESS',
    PENDING_REVIEW: 'PENDING_REVIEW',
    RESOLVED: 'RESOLVED'
  },

  TASK_STATUS: {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED'
  },

  LINK_STATUS: {
    ACTIVE: 'ACTIVE',
    COMPLETED: 'COMPLETED',
    DELEGATED: 'DELEGATED',
    EXPIRED: 'EXPIRED',
    ADMIN_LOCKED: 'ADMIN_LOCKED'
  },

  // Cause categories
  CAUSE_CATEGORIES: ['POVERTY', 'ILLNESS', 'FAMILY_ISSUE', 'TRANSPORTATION', 'OTHER'],

  // Review actions
  REVIEW_ACTIONS: ['ASSIST', 'FORWARD', 'CLOSE'],

  // Delegation
  DEFAULT_MAX_DELEGATION_DEPTH: 3
};
