const express = require('express');
const path = require('path');
const fs = require('fs');

function loadEnvFromFile() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  lines.forEach((line) => {
    const raw = line.trim();
    if (!raw || raw.startsWith('#')) return;

    const normalized = raw.startsWith('export ') ? raw.slice(7).trim() : raw;
    const idx = normalized.indexOf('=');
    if (idx < 1) return;

    const key = normalized.slice(0, idx).trim();
    let value = normalized.slice(idx + 1).trim();
    if (!key) return;

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

loadEnvFromFile();

const db = require('./db/database');
const { getUploadsDir, ensureDir } = require('./utils/storage-paths');

const app = express();
const PORT = process.env.PORT || 3000;
const uploadsDir = getUploadsDir();
ensureDir(uploadsDir);

const trustProxyValue = String(process.env.TRUST_PROXY || '').trim().toLowerCase();
const shouldTrustProxy =
  trustProxyValue === '1' ||
  trustProxyValue === 'true' ||
  (process.env.NODE_ENV === 'production' && trustProxyValue !== '0' && trustProxyValue !== 'false');

if (shouldTrustProxy) {
  app.set('trust proxy', 1);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

app.get('/healthz', (req, res) => {
  try {
    db.prepare('SELECT 1 as ok').get();
    res.status(200).json({
      status: 'ok',
      uptime_sec: Math.round(process.uptime()),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      error: 'DB_UNAVAILABLE',
      message: err && err.message ? err.message : 'database unavailable'
    });
  }
});

const pagesRouter = require('./routes/pages');
const apiRouter = require('./routes/api');

app.use('/api', apiRouter);
app.use('/', pagesRouter);

app.listen(PORT, () => {
  console.log(`STS server running at http://localhost:${PORT}`);
});
