const crypto = require('crypto');

const COOKIE_NAME = 'sts_admin_session';
const SESSION_HOURS = 8;

function getAdminKey() {
  return String(process.env.ADMIN_ACCESS_KEY || '').trim();
}

function parseCookies(req) {
  const raw = req.headers.cookie || '';
  const out = {};
  raw.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx < 0) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (!key) return;
    out[key] = decodeURIComponent(val);
  });
  return out;
}

function sign(expiry) {
  return crypto
    .createHash('sha256')
    .update(`${expiry}|${getAdminKey()}`)
    .digest('hex');
}

function buildSessionValue() {
  const expiry = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  return `${expiry}.${sign(expiry)}`;
}

function isSessionValid(value) {
  if (!value) return false;
  const parts = String(value).split('.');
  if (parts.length !== 2) return false;
  const expiry = Number(parts[0]);
  const signature = parts[1];
  if (!Number.isFinite(expiry) || !signature) return false;
  if (Date.now() > expiry) return false;
  if (!getAdminKey()) return false;
  const expected = sign(expiry);
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

function isHttpsRequest(req) {
  if (!req) return false;
  if (req.secure) return true;
  const forwarded = String(req.headers['x-forwarded-proto'] || '').toLowerCase();
  return forwarded.split(',').map((v) => v.trim()).includes('https');
}

function setAdminSessionCookie(res, req) {
  const maxAge = SESSION_HOURS * 60 * 60;
  let cookie = `${COOKIE_NAME}=${encodeURIComponent(buildSessionValue())}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
  if (process.env.NODE_ENV === 'production' && isHttpsRequest(req)) {
    cookie += '; Secure';
  }
  res.setHeader('Set-Cookie', cookie);
}

function clearAdminSessionCookie(res, req) {
  let cookie = `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  if (process.env.NODE_ENV === 'production' && isHttpsRequest(req)) {
    cookie += '; Secure';
  }
  res.setHeader('Set-Cookie', cookie);
}

function isAuthorized(req) {
  const key = getAdminKey();
  if (!key) return true; // fail-open for local dev until key is configured
  const cookies = parseCookies(req);
  return isSessionValid(cookies[COOKIE_NAME]);
}

function requireAdminPage(req, res, next) {
  if (isAuthorized(req)) return next();
  const nextPath = encodeURIComponent(req.originalUrl || '/');
  return res.redirect(`/admin-access?next=${nextPath}`);
}

function requireAdminApi(req, res, next) {
  if (isAuthorized(req)) return next();
  return res.status(401).json({ error: 'ADMIN_ACCESS_REQUIRED' });
}

module.exports = {
  getAdminKey,
  setAdminSessionCookie,
  clearAdminSessionCookie,
  requireAdminPage,
  requireAdminApi
};
