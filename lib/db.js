// SQLite-backed persistence for past audit results (README step 3). A
// single local file — no account, no API keys, no external service. Swap
// for Postgres/Supabase later if you need audits shared across multiple
// instances; only this file and the /api/audits routes would need to change.

const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "audits.db");

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS audits (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    title TEXT,
    generated_at TEXT NOT NULL,
    result TEXT NOT NULL
  )
`);

function saveAudit(id, result) {
  db.prepare(
    `INSERT OR REPLACE INTO audits (id, url, title, generated_at, result) VALUES (?, ?, ?, ?, ?)`
  ).run(id, result.url, result.title || null, result.generatedAt, JSON.stringify(result));
}

function listAudits() {
  return db
    .prepare(`SELECT id, url, title, generated_at as generatedAt FROM audits ORDER BY generated_at DESC`)
    .all();
}

function getAudit(id) {
  const row = db.prepare(`SELECT result FROM audits WHERE id = ?`).get(id);
  if (!row) return null;
  return { id, ...JSON.parse(row.result) };
}

module.exports = { saveAudit, listAudits, getAudit };
