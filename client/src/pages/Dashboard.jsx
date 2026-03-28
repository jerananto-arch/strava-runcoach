import { useNavigate } from "react-router-dom";
import { useReports } from "../hooks/useReports";
import StatCard from "../components/StatCard";
import GoalCard from "../components/GoalCard";
import RunCard from "../components/RunCard";
import ZoneBar from "../components/ZoneBar";
import { VolumeChart, FitnessChart, EfficiencyChart, CadenceChart } from "../components/TrendCharts";
import { fmtTime, fmtWeek } from "../utils/format";
import { Activity, Flame, Clock, TrendingUp, RefreshCw, ChevronRight } from "lucide-react";
import { api } from "../utils/api";
import { useState } from "react";

export default function Dashboard() {
  const nav = useNavigate();
  const { reports, loading, error } = useReports();
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(null);

  async function handleGenerate() {
    setGenerating(true);
    setGenError(null);
    try {
      await api.generateReport();
      window.location.reload();
    } catch (e) {
      setGenError("Failed to generate report. Try again.");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return <Loader />;
  if (error)   return <Error msg={error} />;
  if (!reports.length) return <Empty />;

  const latest = reports[0];
  const { summary, goal, mechanics, weekStart, weekEnd, trainingWeek, weeksToRace } = latest;

  return (
    <div className="min-h-screen bg-[#0a0f1e] pb-24 safe-top">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 bg-[#0a0f1e] sticky top-0 z-10 border-b border-slate-800/50 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">RunCoach</div>
            <h1 className="text-lg font-bold text-white mt-0.5">
              Week {trainingWeek}
              <span className="text-slate-500 text-base font-normal ml-2">· {weeksToRace}w to race</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-1 text-xs text-white bg-brand-orange px-3 py-2 rounded-xl disabled:opacity-50 active:scale-95 transition-transform"
            >
              <RefreshCw size={12} className={generating ? "animate-spin" : ""} />
              {generating ? "Generating…" : "Generate Report"}
            </button>
            <button
              onClick={() => nav("/trends")}
              className="flex items-center gap-1 text-xs text-slate-400 bg-[#1e293b] px-3 py-2 rounded-xl"
            >
              <TrendingUp size={12} /> Trends
            </button>
          </div>
        </div>
        <div className="text-xs text-slate-500 mt-1">{fmtWeek(weekStart, weekEnd)}</div>
      </div>

      {genError && (
        <div className="mx-4 mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{genError}</div>
      )}
      <div className="px-4 pt-4 space-y-4">
        {/* Volume summary */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Distance" value={`${summary.totalKm} km`} sub={`${summary.volumePct}% of target`} icon={Activity} accent={summary.volumePct >= 95 ? "text-green-400" : summary.volumePct >= 80 ? "text-yellow-400" : "text-red-400"} />
          <StatCard label="Runs" value={summary.totalRuns} sub="this week" icon={Flame} />
          <StatCard label="Time" value={fmtTime(summary.totalTimeSecs)} sub="on feet" icon={Clock} />
        </div>

        {/* Goal card */}
        <GoalCard goal={goal} />

        {/* Zone distribution */}
        {summary.allZones && (
          <div className="bg-[#1e293b] rounded-2xl p-4 space-y-3">
            <div className="text-sm font-semibold text-white">Intensity Distribution</div>
            <ZoneBar zoneDist={summary.allZones} easyPct={summary.easyPct} />
          </div>
        )}

        {/* Coaching insight */}
        <CoachingInsight summary={summary} goal={goal} mechanics={mechanics} />

        {/* This week's runs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-white">This Week's Runs</div>
            <button onClick={() => nav(`/week/${weekStart}`)} className="flex items-center gap-0.5 text-xs text-slate-400">
              All details <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {latest.data?.runs
              ? latest.data.runs.map((run) => <RunCard key={run.id} run={run} weekStart={weekStart} />)
              : <div className="text-slate-500 text-sm">Open full report to see runs</div>
            }
          </div>
        </div>

        {/* Past weeks */}
        {reports.length > 1 && (
          <div>
            <div className="text-sm font-semibold text-white mb-3">Past Weeks</div>
            <div className="space-y-2">
              {reports.slice(1).map((r) => (
                <button
                  key={r.weekStart}
                  onClick={() => nav(`/week/${r.weekStart}`)}
                  className="w-full bg-[#1e293b] rounded-xl px-4 py-3 flex items-center justify-between active:scale-[0.98] transition-transform"
                >
                  <div className="text-left">
                    <div className="text-sm text-white">{fmtWeek(r.weekStart, r.weekEnd)}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Wk {r.trainingWeek} · {r.summary?.totalRuns} runs · {r.summary?.totalKm} km</div>
                  </div>
                  <ChevronRight size={16} className="text-slate-600" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CoachingInsight({ summary, goal, mechanics }) {
  const insights = [];

  if (summary.easyPct < 60)
    insights.push({ type: "warn", text: "Too much Z3+. Slow your easy runs down to below 140 bpm to build aerobic base." });
  else if (summary.easyPct < 75)
    insights.push({ type: "caution", text: "Slightly too intense. Aim for 80% of km in Z1–Z2 (below 140 bpm)." });
  else
    insights.push({ type: "ok", text: "Good intensity distribution. Keep most runs in Z2 to build your aerobic engine." });

  if (goal?.predictedDiffSecs > 0) {
    const minsOff = Math.round(goal.predictedDiffSecs / 60);
    insights.push({ type: minsOff > 20 ? "warn" : "caution", text: minsOff > 20 ? `~${minsOff} min off goal. Focus: Z2 volume + one weekly tempo at 5:20–5:40/km.` : `~${minsOff} min off goal. Add race-specific intervals at 4:58/km.` });
  }

  if (mechanics?.avgCadence && mechanics.avgCadence < 170)
    insights.push({ type: "caution", text: `Cadence ${mechanics.avgCadence} spm — 2 below target. Run to a 170 bpm metronome one session/week.` });

  const colors = { ok: "border-green-500/30 bg-green-500/5 text-green-300", caution: "border-yellow-500/30 bg-yellow-500/5 text-yellow-300", warn: "border-red-500/30 bg-red-500/5 text-red-300" };

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-white">Coaching Insights</div>
      {insights.map((ins, i) => (
        <div key={i} className={`border rounded-xl px-4 py-3 text-sm ${colors[ins.type]}`}>
          {ins.text}
        </div>
      ))}
    </div>
  );
}

function Loader() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <RefreshCw size={24} className="text-brand-orange animate-spin" />
        <div className="text-slate-400 text-sm">Loading your training data…</div>
      </div>
    </div>
  );
}

function Error({ msg }) {
  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-6">
      <div className="text-center space-y-3">
        <div className="text-red-400 font-semibold">Failed to load reports</div>
        <div className="text-slate-500 text-sm">{msg}</div>
      </div>
    </div>
  );
}

function Empty() {
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      await api.generateReport();
      window.location.reload();
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <div className="text-4xl">🏃</div>
        <div className="text-white font-semibold">No reports yet</div>
        <div className="text-slate-400 text-sm">Tap below to generate your first report now.</div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 mx-auto text-sm text-white bg-brand-orange px-5 py-3 rounded-xl disabled:opacity-50 active:scale-95 transition-transform"
        >
          <RefreshCw size={14} className={generating ? "animate-spin" : ""} />
          {generating ? "Generating…" : "Generate Report"}
        </button>
      </div>
    </div>
  );
}
