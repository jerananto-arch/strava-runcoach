export function fmtPace(secsPerKm) {
  if (!secsPerKm) return "–";
  const m = Math.floor(secsPerKm / 60);
  const s = Math.round(secsPerKm % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function fmtTime(secs) {
  if (!secs) return "–";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.round(secs % 60).toString().padStart(2, "0");
  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s}` : `${m}:${s}`;
}

export function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function fmtWeek(start, end) {
  const s = new Date(start).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  const e = new Date(end).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  return `${s} – ${e}`;
}

export function diffStr(secs) {
  if (!secs) return null;
  const abs = Math.abs(secs);
  const m = Math.floor(abs / 60);
  const s = Math.round(abs % 60).toString().padStart(2, "0");
  const sign = secs > 0 ? "+" : "-";
  return `${sign}${m}:${s}`;
}

export const ZONE_COLORS = {
  Z1: "#64748b",
  Z2: "#22c55e",
  Z3: "#f59e0b",
  Z4: "#f97316",
  Z5: "#ef4444",
};

export const ZONE_LABELS = {
  Z1: "Recovery",
  Z2: "Aerobic",
  Z3: "Tempo",
  Z4: "Threshold",
  Z5: "VO₂max",
};
