import { useParams, useNavigate } from "react-router-dom";
import { useReport } from "../hooks/useReports";
import { fmtTime, fmtDate, ZONE_COLORS, ZONE_LABELS } from "../utils/format";
import { ArrowLeft, Heart, Footprints, Mountain, RefreshCw } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const TOOLTIP_STYLE = { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "12px", color: "#f8fafc", fontSize: 12 };

export default function RunDetail() {
  const { weekStart, runId } = useParams();
  const nav = useNavigate();
  const { report, loading } = useReport(weekStart);

  if (loading) return <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center"><RefreshCw size={24} className="text-brand-orange animate-spin" /></div>;

  const run = report?.runs?.find((r) => String(r.id) === String(runId));
  if (!run) return <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center text-slate-400">Run not found</div>;

  const splitData = run.splits.map((s) => ({
    km:    s.km,
    pace:  s.paceSeconds || null,
    hr:    s.hr || null,
    zone:  s.zone,
  }));

  const hrColor = run.avgHR
    ? run.avgHR < 140 ? "#22c55e" : run.avgHR < 158 ? "#f59e0b" : "#ef4444"
    : "#64748b";

  return (
    <div className="min-h-screen bg-[#0a0f1e] pb-24 safe-top">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 sticky top-0 bg-[#0a0f1e] z-10 border-b border-slate-800/50">
        <button onClick={() => nav(-1)} className="flex items-center gap-2 text-slate-400 mb-3">
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-lg font-bold text-white">{run.name}</h1>
        <div className="text-xs text-slate-500">{fmtDate(run.date)}</div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Top stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1e293b] rounded-2xl p-4 col-span-2 grid grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-xs text-slate-500">Distance</div>
              <div className="text-lg font-bold text-white">{run.distKm}</div>
              <div className="text-xs text-slate-500">km</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-500">Time</div>
              <div className="text-lg font-bold text-white">{fmtTime(run.movingTime)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-500">Avg Pace</div>
              <div className="text-lg font-bold text-brand-orange">{run.avgPace}</div>
              <div className="text-xs text-slate-500">/km</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-500">Elevation</div>
              <div className="text-lg font-bold text-white">+{run.elevation}</div>
              <div className="text-xs text-slate-500">m</div>
            </div>
          </div>
        </div>

        {/* HR + cadence row */}
        <div className="grid grid-cols-2 gap-3">
          {run.avgHR && (
            <div className="bg-[#1e293b] rounded-2xl p-4">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2"><Heart size={11} /> Heart Rate</div>
              <div className="text-2xl font-bold" style={{ color: hrColor }}>{run.avgHR}</div>
              <div className="text-xs text-slate-500">avg · max {run.maxHR}</div>
              <div className="text-xs mt-1 font-medium" style={{ color: hrColor }}>{run.hrZone}</div>
              {run.hrDrift !== null && (
                <div className={`text-xs mt-1 ${Math.abs(run.hrDrift) <= 5 ? "text-green-400" : Math.abs(run.hrDrift) <= 12 ? "text-yellow-400" : "text-red-400"}`}>
                  drift +{run.hrDrift} bpm
                </div>
              )}
            </div>
          )}
          {run.cadence && (
            <div className="bg-[#1e293b] rounded-2xl p-4">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2"><Footprints size={11} /> Cadence</div>
              <div className={`text-2xl font-bold ${run.cadence >= 170 ? "text-green-400" : run.cadence >= 165 ? "text-yellow-400" : "text-red-400"}`}>{run.cadence}</div>
              <div className="text-xs text-slate-500">spm</div>
              <div className={`text-xs mt-1 font-medium ${run.cadence >= 170 ? "text-green-400" : "text-yellow-400"}`}>
                {run.cadence >= 175 ? "Excellent" : run.cadence >= 170 ? "Good" : "Target: 170+"}
              </div>
            </div>
          )}
        </div>

        {/* Pace chart */}
        {splitData.length > 2 && (
          <div className="bg-[#1e293b] rounded-2xl p-4">
            <div className="text-sm font-semibold text-white mb-3">Pace per km</div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={splitData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="paceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fc4c02" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fc4c02" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="km" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: "km", fill: "#64748b", fontSize: 10, position: "insideRight" }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} reversed domain={["auto", "auto"]}
                  tickFormatter={(v) => `${Math.floor(v / 60)}:${(v % 60).toString().padStart(2, "0")}`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${Math.floor(v / 60)}:${(v % 60).toString().padStart(2, "0")}/km`, "Pace"]} />
                <ReferenceLine y={298} stroke="#22c55e" strokeDasharray="4 4" label={{ value: "Goal", fill: "#22c55e", fontSize: 10 }} />
                <Area type="monotone" dataKey="pace" stroke="#fc4c02" strokeWidth={2} fill="url(#paceGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* HR chart */}
        {splitData.some((s) => s.hr) && (
          <div className="bg-[#1e293b] rounded-2xl p-4">
            <div className="text-sm font-semibold text-white mb-3">Heart Rate per km</div>
            <ResponsiveContainer width="100%" height={130}>
              <AreaChart data={splitData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="km" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} domain={[100, 200]} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v} bpm`, "HR"]} />
                <ReferenceLine y={140} stroke="#22c55e" strokeDasharray="4 4" label={{ value: "Z2 ceiling", fill: "#22c55e", fontSize: 10 }} />
                <ReferenceLine y={158} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Z3 ceiling", fill: "#f59e0b", fontSize: 10 }} />
                <Area type="monotone" dataKey="hr" stroke="#ef4444" strokeWidth={2} fill="url(#hrGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Splits table */}
        <div className="bg-[#1e293b] rounded-2xl p-4">
          <div className="text-sm font-semibold text-white mb-3">Splits</div>
          <div className="space-y-1">
            {run.splits.filter(s => s.km <= run.splits.length - 1 || run.splits.length <= 3).map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 text-xs text-slate-500 font-mono">km {s.km}</div>
                  <div className="w-2 h-2 rounded-full" style={{ background: ZONE_COLORS[s.zone] || "#64748b" }} />
                  <div className="text-sm font-mono text-white">{s.pace}<span className="text-slate-500 text-xs">/km</span></div>
                </div>
                <div className="flex items-center gap-3">
                  {s.hr && <div className="text-xs text-slate-400">{s.hr} bpm</div>}
                  <div className="text-xs font-medium" style={{ color: ZONE_COLORS[s.zone] || "#64748b" }}>{s.zone}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Garmin dynamics */}
        {run.garminDynamics?.has_dynamics && (
          <div className="bg-[#1e293b] rounded-2xl p-4">
            <div className="text-sm font-semibold text-white mb-3">Running Dynamics</div>
            <div className="grid grid-cols-2 gap-3">
              {run.garminDynamics.ground_contact_time_ms && (
                <DynamicStat label="Ground Contact" value={`${run.garminDynamics.ground_contact_time_ms}ms`}
                  status={run.garminDynamics.ground_contact_time_ms < 240 ? "ok" : "warn"}
                  sub="target <240ms" />
              )}
              {run.garminDynamics.vertical_oscillation_cm && (
                <DynamicStat label="Vert. Oscillation" value={`${run.garminDynamics.vertical_oscillation_cm}cm`}
                  status={run.garminDynamics.vertical_oscillation_cm < 8.5 ? "ok" : "warn"}
                  sub="target <8.5cm" />
              )}
              {run.garminDynamics.vertical_ratio_pct && (
                <DynamicStat label="Vertical Ratio" value={`${run.garminDynamics.vertical_ratio_pct}%`}
                  status={run.garminDynamics.vertical_ratio_pct < 9.5 ? "ok" : "warn"}
                  sub="target <9.5%" />
              )}
              {run.garminDynamics.stride_length_m && (
                <DynamicStat label="Stride Length" value={`${run.garminDynamics.stride_length_m}m`} sub="" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DynamicStat({ label, value, sub, status }) {
  const color = status === "ok" ? "text-green-400" : status === "warn" ? "text-yellow-400" : "text-white";
  return (
    <div className="bg-[#0f172a] rounded-xl p-3">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}
