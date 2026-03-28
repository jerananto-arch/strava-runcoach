/**
 * Generates a weekly report: fetches Strava data, runs analysis, saves to DB.
 */
const strava   = require("./strava");
const { analyzeRun, analyzeWeek } = require("./analysis");
const db       = require("./db");
const push     = require("./notifications");

function getWeekBounds(date = new Date()) {
  const JAKARTA_OFFSET = 7 * 3600;
  const nowUtc  = Math.floor(date.getTime() / 1000);
  const nowJkt  = nowUtc + JAKARTA_OFFSET;
  const dow     = new Date(nowJkt * 1000).getUTCDay();
  const daysSinceMon = (dow + 6) % 7;
  const monMidnightJkt = nowJkt - (nowJkt % 86400) - daysSinceMon * 86400;
  const sunEndJkt      = monMidnightJkt + 7 * 86400 - 1;

  const toISO = (jktTs) => {
    const d = new Date((jktTs - JAKARTA_OFFSET) * 1000);
    return d.toISOString().split("T")[0];
  };

  return {
    after:     monMidnightJkt - JAKARTA_OFFSET,
    before:    sunEndJkt - JAKARTA_OFFSET,
    weekStart: toISO(monMidnightJkt),
    weekEnd:   toISO(sunEndJkt),
  };
}

async function generateReport(date = new Date()) {
  const week = getWeekBounds(date);
  console.log(`[report] Generating report for ${week.weekStart} → ${week.weekEnd}`);

  const activities = await strava.getActivitiesForWeek(week.after, week.before);
  console.log(`[report] Found ${activities.length} run(s)`);

  const runs = [];
  for (const act of activities) {
    const detail = await strava.getActivityDetail(act.id);
    runs.push(analyzeRun(act, detail));
  }

  runs.sort((a, b) => new Date(a.date) - new Date(b.date));

  const report = analyzeWeek(runs, week.weekStart, week.weekEnd);
  db.saveReport(week.weekStart, week.weekEnd, report);
  console.log(`[report] Saved to DB`);

  // Send push notification
  await push.sendReportReady(week.weekStart, report.summary);

  return report;
}

module.exports = { generateReport, getWeekBounds };
