const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "../data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, "runcoach.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS weekly_reports (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    week_start  TEXT NOT NULL UNIQUE,  -- ISO date "2026-03-23"
    week_end    TEXT NOT NULL,
    generated_at TEXT NOT NULL,
    data        TEXT NOT NULL          -- full JSON blob
  );

  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint   TEXT NOT NULL UNIQUE,
    p256dh     TEXT NOT NULL,
    auth       TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = {
  saveReport(weekStart, weekEnd, data) {
    db.prepare(`
      INSERT INTO weekly_reports (week_start, week_end, generated_at, data)
      VALUES (?, ?, datetime('now'), ?)
      ON CONFLICT(week_start) DO UPDATE SET
        week_end = excluded.week_end,
        generated_at = excluded.generated_at,
        data = excluded.data
    `).run(weekStart, weekEnd, JSON.stringify(data));
  },

  getReport(weekStart) {
    const row = db.prepare("SELECT * FROM weekly_reports WHERE week_start = ?").get(weekStart);
    return row ? { ...row, data: JSON.parse(row.data) } : null;
  },

  getAllReports() {
    return db.prepare("SELECT week_start, week_end, generated_at, data FROM weekly_reports ORDER BY week_start DESC").all()
      .map((r) => ({ ...r, data: JSON.parse(r.data) }));
  },

  getRecentReports(n = 12) {
    return db.prepare("SELECT week_start, week_end, generated_at, data FROM weekly_reports ORDER BY week_start DESC LIMIT ?").all(n)
      .map((r) => ({ ...r, data: JSON.parse(r.data) }));
  },

  saveSubscription(sub) {
    db.prepare(`
      INSERT OR REPLACE INTO push_subscriptions (endpoint, p256dh, auth)
      VALUES (?, ?, ?)
    `).run(sub.endpoint, sub.keys.p256dh, sub.keys.auth);
  },

  removeSubscription(endpoint) {
    db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").run(endpoint);
  },

  getAllSubscriptions() {
    return db.prepare("SELECT endpoint, p256dh, auth FROM push_subscriptions").all()
      .map((s) => ({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }));
  },
};
