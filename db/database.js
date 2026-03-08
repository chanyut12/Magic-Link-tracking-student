const Database = require('better-sqlite3');
const { getDbPath, ensureDirForFile } = require('../utils/storage-paths');

const dbPath = getDbPath();
ensureDirForFile(dbPath);
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
