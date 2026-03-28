const BASE = import.meta.env.VITE_API_URL || "";

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  getReports:       ()     => apiFetch("/api/reports"),
  getReport:        (week) => apiFetch(`/api/reports/${week}`),
  getCurrentReport: ()     => apiFetch("/api/reports/current"),
  generateReport:   ()     => apiFetch("/api/reports/generate", { method: "POST" }),
  getVapidKey:      ()     => apiFetch("/api/vapid-public-key"),
  subscribe:        (sub)  => apiFetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub) }),
  unsubscribe:      (ep)   => apiFetch("/api/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: ep }) }),
};
