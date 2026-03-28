import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { fmtDate, fmtTime } from "../utils/format";

const TOOLTIP_STYLE = {
  backgroundColor: "#1e293b",
  border: "1px solid #334155",
  borderRadius: "12px",
  color: "#f8fafc",
  fontSize: 12,
};

function WeekLabel({ weekStart }) {
  const d = new Date(weekStart);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function VolumeChart({ reports }) {
  const data = [...reports].reverse().map((r) => ({
    week:    r.weekStart,
    km:      r.summary?.totalKm || 0,
    target:  r.summary?.targetKm || 35,
  }));

  return (
    <div className="bg-[#1e293b] rounded-2xl p-4">
      <div className="text-sm font-semibold text-white mb-3">Weekly Volume (km)</div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="week" tickFormatter={(v) => `${new Date(v).getDate()}/${new Date(v).getMonth() + 1}`} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v} km`]} labelFormatter={(v) => `Week of ${fmtDate(v)}`} />
          <Bar dataKey="target" fill="#1e3a5f" radius={[3, 3, 0, 0]} name="Target" />
          <Bar dataKey="km" fill="#fc4c02" radius={[3, 3, 0, 0]} name="Actual" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FitnessChart({ reports }) {
  const data = [...reports].reverse()
    .filter((r) => r.goal?.predictedHMSecs)
    .map((r) => ({
      week:      r.weekStart,
      predicted: Math.round(r.goal.predictedHMSecs / 60), // minutes
      goal:      105, // 1:45 = 105 min
    }));

  if (!data.length) return null;

  return (
    <div className="bg-[#1e293b] rounded-2xl p-4">
      <div className="text-sm font-semibold text-white mb-1">Predicted HM Time</div>
      <div className="text-xs text-slate-500 mb-3">Lower = fitter</div>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="week" tickFormatter={(v) => `${new Date(v).getDate()}/${new Date(v).getMonth() + 1}`} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} tickFormatter={(v) => `${Math.floor(v / 60)}h${(v % 60).toString().padStart(2, "0")}`} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${Math.floor(v / 60)}:${(v % 60).toString().padStart(2, "0")}`]} labelFormatter={(v) => `Week of ${fmtDate(v)}`} />
          <ReferenceLine y={105} stroke="#22c55e" strokeDasharray="4 4" label={{ value: "Goal", fill: "#22c55e", fontSize: 10 }} />
          <Line type="monotone" dataKey="predicted" stroke="#fc4c02" strokeWidth={2} dot={{ fill: "#fc4c02", r: 3 }} name="Predicted HM" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function EfficiencyChart({ reports }) {
  const data = [...reports].reverse()
    .filter((r) => r.summary?.avgEfficiency)
    .map((r) => ({
      week: r.weekStart,
      eff:  Math.round(r.summary.avgEfficiency * 10000) / 10000,
    }));

  if (!data.length) return null;

  return (
    <div className="bg-[#1e293b] rounded-2xl p-4">
      <div className="text-sm font-semibold text-white mb-1">Aerobic Efficiency</div>
      <div className="text-xs text-slate-500 mb-3">Pace per bpm — lower = fitter</div>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="week" tickFormatter={(v) => `${new Date(v).getDate()}/${new Date(v).getMonth() + 1}`} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} tickFormatter={(v) => v.toFixed(4)} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v.toFixed(4), "min/km/bpm"]} labelFormatter={(v) => `Week of ${fmtDate(v)}`} />
          <Line type="monotone" dataKey="eff" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 3 }} name="Efficiency" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CadenceChart({ reports }) {
  const data = [...reports].reverse()
    .filter((r) => r.summary?.avgCadence)
    .map((r) => ({
      week:    r.weekStart,
      cadence: r.summary.avgCadence,
    }));

  if (!data.length) return null;

  return (
    <div className="bg-[#1e293b] rounded-2xl p-4">
      <div className="text-sm font-semibold text-white mb-1">Avg Cadence (spm)</div>
      <div className="text-xs text-slate-500 mb-3">Target: 170–180 spm</div>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="week" tickFormatter={(v) => `${new Date(v).getDate()}/${new Date(v).getMonth() + 1}`} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} domain={[160, 185]} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v} spm`]} labelFormatter={(v) => `Week of ${fmtDate(v)}`} />
          <ReferenceLine y={170} stroke="#22c55e" strokeDasharray="4 4" />
          <ReferenceLine y={180} stroke="#22c55e" strokeDasharray="4 4" />
          <Line type="monotone" dataKey="cadence" stroke="#a855f7" strokeWidth={2} dot={{ fill: "#a855f7", r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
