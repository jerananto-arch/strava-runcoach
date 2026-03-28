// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_HR   = 190;  // Tanaka formula: 208 - 0.7×26
const VO2MAX   = 52;
const HM_DIST  = 21.0975;
const HM_GOAL  = 6300; // 1:45:00 in seconds
const RACE_DATE = new Date("2026-10-11");

const HR_ZONES = [
  { name: "Z1", label: "Recovery",  min: 0,   max: 114 },
  { name: "Z2", label: "Aerobic",   min: 114, max: 140 },
  { name: "Z3", label: "Tempo",     min: 140, max: 158 },
  { name: "Z4", label: "Threshold", min: 158, max: 171 },
  { name: "Z5", label: "VO2max",    min: 171, max: 999 },
];

const WEEKLY_KM_TARGETS = [
  30,30,32,35,35,38,40,38,42,44,44,46,48,48,50,52,50,40,21
];

const VDOT_HM_TABLE = [
  [30,9120],[32,8580],[34,8100],[36,7680],[38,7320],
  [40,6960],[42,6660],[44,6360],[46,6120],[48,5880],
  [50,5640],[52,5496],[54,5280],[56,5100],[58,4920],
  [60,4776],[62,4620],[64,4500],[66,4380],[68,4260],[70,4140],
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function paceStr(mps) {
  if (!mps || mps <= 0) return null;
  const spk = 1000 / mps;
  return `${Math.floor(spk / 60)}:${Math.round(spk % 60).toString().padStart(2, "0")}`;
}

function fmtTime(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.round(secs % 60).toString().padStart(2, "0");
  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s}` : `${m}:${s}`;
}

function hrZone(hr) {
  if (!hr) return null;
  return HR_ZONES.find((z) => hr >= z.min && hr < z.max)?.name || "Z5";
}

function weeksToRace() {
  return Math.max(0, Math.round((RACE_DATE - new Date()) / (7 * 24 * 3600 * 1000)));
}

function trainingWeek() {
  const start = new Date("2026-03-23");
  return Math.max(1, Math.round((new Date() - start) / (7 * 24 * 3600 * 1000)) + 1);
}

function vo2maxHMCeiling() {
  for (let i = 0; i < VDOT_HM_TABLE.length - 1; i++) {
    const [v1, t1] = VDOT_HM_TABLE[i];
    const [v2, t2] = VDOT_HM_TABLE[i + 1];
    if (VO2MAX >= v1 && VO2MAX <= v2) {
      return t1 + (t2 - t1) * ((VO2MAX - v1) / (v2 - v1));
    }
  }
  return null;
}

// ── Per-run analysis ──────────────────────────────────────────────────────────
function analyzeRun(activity, detail) {
  const splits = (detail.splits_metric || []).map((s) => ({
    km:      s.split,
    pace:    paceStr(s.average_speed),
    paceSeconds: s.average_speed ? Math.round(1000 / s.average_speed) : null,
    speedMps: s.average_speed,
    hr:      s.average_heartrate ? Math.round(s.average_heartrate) : null,
    zone:    hrZone(s.average_heartrate),
    distKm:  s.distance / 1000,
  }));

  // HR drift (first third vs last third)
  const thirds = Math.max(1, Math.floor(splits.length / 3));
  const firstHRs = splits.slice(0, thirds).filter((s) => s.hr).map((s) => s.hr);
  const lastHRs  = splits.slice(-thirds).filter((s) => s.hr).map((s) => s.hr);
  const hrDrift  = firstHRs.length && lastHRs.length
    ? Math.round(lastHRs.reduce((a, b) => a + b) / lastHRs.length - firstHRs.reduce((a, b) => a + b) / firstHRs.length)
    : null;

  // Zone distribution
  const zoneDist = { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 };
  splits.forEach((s) => { if (s.zone) zoneDist[s.zone] = (zoneDist[s.zone] || 0) + (s.distKm || 1); });

  // Pace consistency
  const speeds = splits.map((s) => s.speedMps).filter(Boolean);
  const avgSpd = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  const paceConsistency = speeds.length > 1
    ? Math.round((1 - Math.sqrt(speeds.reduce((s, v) => s + (v - avgSpd) ** 2, 0) / speeds.length) / avgSpd) * 100)
    : null;

  // Aerobic efficiency
  const efficiency = activity.average_speed && activity.average_heartrate
    ? (1000 / activity.average_speed / 60) / activity.average_heartrate
    : null;

  return {
    id:            activity.id,
    name:          activity.name,
    date:          activity.start_date_local,
    distKm:        Math.round(activity.distance / 10) / 100,
    movingTime:    activity.moving_time,
    avgSpeed:      activity.average_speed,
    maxSpeed:      activity.max_speed,
    avgPace:       paceStr(activity.average_speed),
    avgPaceSecs:   activity.average_speed ? Math.round(1000 / activity.average_speed) : null,
    maxPace:       paceStr(activity.max_speed),
    avgHR:         activity.average_heartrate ? Math.round(activity.average_heartrate) : null,
    maxHR:         activity.max_heartrate || null,
    hrZone:        hrZone(activity.average_heartrate),
    cadence:       activity.average_cadence ? Math.round(activity.average_cadence * 2) : null,
    elevation:     Math.round(activity.total_elevation_gain),
    splits,
    hrDrift,
    paceConsistency,
    zoneDist,
    efficiency,
    kudos:         activity.kudos_count,
    garminDynamics: null, // populated later if USB available
  };
}

// ── Weekly analysis ───────────────────────────────────────────────────────────
function analyzeWeek(runs, weekStart, weekEnd) {
  const totalKm   = runs.reduce((s, r) => s + r.distKm, 0);
  const totalTime = runs.reduce((s, r) => s + r.movingTime, 0);
  const wtr       = weeksToRace();
  const week      = trainingWeek();
  const targetKm  = WEEKLY_KM_TARGETS[Math.min(week - 1, WEEKLY_KM_TARGETS.length - 1)];
  const longRun   = runs.reduce((a, b) => a.distKm > b.distKm ? a : b, { distKm: 0 });

  // Zone totals across all runs
  const allZones = { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 };
  runs.forEach((r) => Object.entries(r.zoneDist).forEach(([z, km]) => { allZones[z] += km; }));
  const totalZoneKm = Object.values(allZones).reduce((a, b) => a + b, 0);
  const easyPct = totalZoneKm > 0 ? Math.round(((allZones.Z1 + allZones.Z2) / totalZoneKm) * 100) : 0;

  // Fitness prediction from training
  const candidates = runs.filter((r) => r.distKm >= 8 && r.avgHR && r.avgSpeed);
  let predictedHM = null;
  if (candidates.length) {
    const longest = candidates.reduce((a, b) => a.distKm > b.distKm ? a : b);
    const eff = longest.avgSpeed / longest.avgHR;
    const threshMps = eff * (MAX_HR * 0.87) * 0.92;
    predictedHM = Math.round((HM_DIST * 1000) / threshMps);
  }

  const hmCeiling = Math.round(vo2maxHMCeiling());
  const longRunTarget = wtr > 12 ? 14 : wtr > 8 ? 16 : wtr > 4 ? 18 : 21;

  // Avg efficiency across week
  const efficiencies = runs.map((r) => r.efficiency).filter(Boolean);
  const avgEfficiency = efficiencies.length
    ? efficiencies.reduce((a, b) => a + b) / efficiencies.length
    : null;

  // Avg cadence
  const cadences = runs.filter((r) => r.cadence).map((r) => r.cadence);
  const avgCadence = cadences.length ? Math.round(cadences.reduce((a, b) => a + b) / cadences.length) : null;

  // Avg HR
  const hrs = runs.filter((r) => r.avgHR).map((r) => r.avgHR);
  const avgHR = hrs.length ? Math.round(hrs.reduce((a, b) => a + b) / hrs.length) : null;

  return {
    weekStart,
    weekEnd,
    trainingWeek:  week,
    weeksToRace:   wtr,
    runs,
    summary: {
      totalRuns:     runs.length,
      totalKm:       Math.round(totalKm * 10) / 10,
      totalTimeSecs: totalTime,
      totalTimeStr:  fmtTime(totalTime),
      targetKm,
      volumePct:     Math.round((totalKm / targetKm) * 100),
      avgHR,
      avgCadence,
      avgEfficiency: avgEfficiency ? Math.round(avgEfficiency * 10000) / 10000 : null,
      allZones,
      easyPct,
    },
    goal: {
      hmGoalSecs:      HM_GOAL,
      hmGoalStr:       fmtTime(HM_GOAL),
      goalPaceStr:     paceStr(HM_DIST * 1000 / HM_GOAL),
      goalPaceSecs:    Math.round(HM_GOAL / HM_DIST),
      predictedHMSecs: predictedHM,
      predictedHMStr:  predictedHM ? fmtTime(predictedHM) : null,
      predictedDiffSecs: predictedHM ? predictedHM - HM_GOAL : null,
      hmCeilingSecs:   hmCeiling,
      hmCeilingStr:    hmCeiling ? fmtTime(hmCeiling) : null,
      longRunKm:       longRun.distKm,
      longRunTarget,
      vo2max:          VO2MAX,
      raceDate:        RACE_DATE.toISOString().split("T")[0],
    },
    mechanics: {
      avgCadence,
      cadenceTarget: { min: 170, max: 180 },
      garminAvailable: runs.some((r) => r.garminDynamics?.has_dynamics),
    },
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { analyzeRun, analyzeWeek, HR_ZONES, paceStr, fmtTime };
