const fs = require('fs');
const path = require('path');

function toAbsolute(p) {
  if (!p) return null;
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

function getDataDir() {
  return toAbsolute(process.env.STS_DATA_DIR || '');
}

function getDbPath() {
  const explicit = toAbsolute(process.env.STS_DB_PATH || '');
  if (explicit) return explicit;

  const dataDir = getDataDir();
  if (dataDir) return path.join(dataDir, 'sts.db');

  return path.join(__dirname, '..', 'db', 'sts.db');
}

function getUploadsDir() {
  const explicit = toAbsolute(process.env.STS_UPLOAD_DIR || '');
  if (explicit) return explicit;

  const dataDir = getDataDir();
  if (dataDir) return path.join(dataDir, 'uploads');

  return path.join(__dirname, '..', 'uploads');
}

function ensureDirForFile(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

module.exports = {
  getDbPath,
  getUploadsDir,
  ensureDirForFile,
  ensureDir
};
