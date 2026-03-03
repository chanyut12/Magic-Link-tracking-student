/**
 * Shared helper functions
 */

const crypto = require('crypto');

/**
 * Hash token using SHA-256
 * @param {string} token - Token to hash
 * @returns {string} Hashed token
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate random token
 * @returns {string} Random token (64 characters)
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Mask student name for privacy
 * @param {string} name - Full name
 * @returns {string} Masked name
 */
function maskName(name) {
  if (!name) return name;
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    const prefix = parts[0];
    const firstName = parts[1];
    const masked = firstName.length > 2
      ? firstName.slice(0, 2) + '****'
      : firstName + '****';
    return prefix + ' ' + masked;
  }
  if (name.length <= 2) return name;
  return name.slice(0, 2) + '****';
}

/**
 * Sanitize string to prevent XSS
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitize(str) {
  if (!str) return str;
  return String(str).replace(/[<>"'&]/g, c => ({
    '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;'
  })[c]);
}

/**
 * Clean and sanitize input string
 * @param {string} str - String to clean
 * @returns {string|null} Cleaned string or null
 */
function clean(str) {
  if (!str) return null;
  const s = String(str).trim();
  return s ? sanitize(s) : null;
}

/**
 * Get base URL from request
 * @param {object} req - Express request object
 * @returns {string} Base URL
 */
function getBaseUrl(req) {
  const origin = req.headers.origin;
  if (origin) return String(origin).replace(/\/$/, '');

  const referer = req.headers.referer;
  if (referer) {
    try {
      const u = new URL(referer);
      return `${u.protocol}//${u.host}`;
    } catch (_) {
      // ignore invalid referer
    }
  }

  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const forwardedHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
  const proto = forwardedProto || req.protocol;
  const host = forwardedHost || req.get('host');
  return `${proto}://${host}`;
}

module.exports = {
  hashToken,
  generateToken,
  maskName,
  sanitize,
  clean,
  getBaseUrl
};
