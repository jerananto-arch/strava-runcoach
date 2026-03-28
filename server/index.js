require("dotenv").config({ path: process.env.ENV_FILE || "../strava-mcp/.env" });

const express = require("express");
const cors    = require("cors");
const cron    = require("node-cron");
const path    = require("path");
const fs      = require("fs");

const db      = require("./db");
const push    = require("./notifications");
const { generateReport, getWeekBounds } = require("./report");

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Push notification setup ───────────────────────────────────────────────────
push.init();

// ── API routes ────────────────────────────────────────────────────────────────

// GET /api/reports — all historical reports (summary only)
app.get("/api/reports", (req, res) => {
  const reports = db.getRecentReports(26).map((r) => ({
    weekStart:    r.data.weekStart,
    weekEnd:      r.data.weekEnd,
    trainingWeek: r.data.trainingWeek,
    weeksToRace:  r.data.weeksToRace,
    generatedAt:  r.data.generatedAt,
    summary:      r.data.summary,
    goal:         r.data.goal,
    mechanics:    r.data.mechanics,
  }));
  res.json(reports);
});

// GET /api/reports/:weekStart — full report including run details
app.get("/api/reports/:weekStart", (req, res) => {
  const report = db.getReport(req.params.weekStart);
  if (!report) return res.status(404).json({ error: "Report not found" });
  res.json(report.data);
});

// GET /api/reports/current — generate or return current week
app.get("/api/reports/current", async (req, res) => {
  try {
    const { weekStart, weekEnd } = getWeekBounds();
    const existing = db.getReport(weekStart);
    if (existing) return res.json(existing.data);
    const report = await generateReport();
    res.json(report);
  } catch (err) {
    console.error("[api] /reports/current error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reports/generate — manually trigger report generation
app.post("/api/reports/generate", async (req, res) => {
  try {
    const report = await generateReport();
    res.json({ ok: true, weekStart: report.weekStart });
  } catch (err) {
    console.error("[api] generate error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/vapid-public-key — for push subscription
app.get("/api/vapid-public-key", (req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY });
});

// POST /api/subscribe — save push subscription
app.post("/api/subscribe", (req, res) => {
  try {
    db.saveSubscription(req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/subscribe — remove push subscription
app.delete("/api/subscribe", (req, res) => {
  db.removeSubscription(req.body.endpoint);
  res.json({ ok: true });
});

// GET /api/health
app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// ── Serve React app ───────────────────────────────────────────────────────────
const CLIENT_BUILD = path.join(__dirname, "../client/dist");
if (fs.existsSync(CLIENT_BUILD)) {
  app.use(express.static(CLIENT_BUILD));
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(CLIENT_BUILD, "index.html"));
    }
  });
} else {
  app.get("/", (req, res) => res.json({ status: "API running — build client with: cd client && npm run build" }));
}

// ── Cron: Sunday 11:00 UTC = 18:00 Jakarta ───────────────────────────────────
cron.schedule("0 11 * * 0", async () => {
  console.log("[cron] Running Sunday weekly report...");
  try {
    await generateReport();
    console.log("[cron] Done.");
  } catch (err) {
    console.error("[cron] Error:", err.message);
  }
}, { timezone: "UTC" });

app.listen(PORT, () => {
  console.log(`[server] Running on port ${PORT}`);
  console.log(`[server] Sunday report cron scheduled for 11:00 UTC (18:00 WIB)`);
});
