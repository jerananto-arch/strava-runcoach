import { useParams, useNavigate } from "react-router-dom";
import { useReport } from "../hooks/useReports";
import RunCard from "../components/RunCard";
import GoalCard from "../components/GoalCard";
import ZoneBar from "../components/ZoneBar";
import StatCard from "../components/StatCard";
import { fmtTime, fmtWeek } from "../utils/format";
import { ArrowLeft, Activity, Flame, Clock, RefreshCw } from "lucide-react";

export default function WeekDetail() {
  const { weekStart } = useParams();
  const nav = useNavigate();
  const { report, loading, error } = useReport(weekStart);

  if (loading) return <Loader />;
  if (error || !report) return <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center text-slate-400">Report not found</div>;

  const { summary, goal, runs = [] } = report;

  return (
    <div className="min-h-screen bg-[#0a0f1e] pb-24 safe-top">
      <div className="px-4 pt-6 pb-4 sticky top-0 bg-[#0a0f1e] z-10 border-b border-slate-800/50">
        <button onClick={() => nav(-1)} className="flex items-center gap-2 text-slate-400 mb-3">
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-lg font-bold text-white">{fmtWeek(report.weekStart, report.weekEnd)}</h1>
        <div className="text-xs text-slate-500">Training week {report.trainingWeek} · {report.weeksToRace} weeks to race</div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Distance" value={`${summary.totalKm} km`} icon={Activity} />
          <StatCard label="Runs" value={summary.totalRuns} icon={Flame} />
          <StatCard label="Time" value={fmtTime(summary.totalTimeSecs)} icon={Clock} />
        </div>

        <GoalCard goal={goal} />

        {summary.allZones && (
          <div className="bg-[#1e293b] rounded-2xl p-4 space-y-3">
            <div className="text-sm font-semibold text-white">Intensity Distribution</div>
            <ZoneBar zoneDist={summary.allZones} easyPct={summary.easyPct} />
          </div>
        )}

        {summary.avgEfficiency && (
          <div className="bg-[#1e293b] rounded-2xl p-4">
            <div className="text-sm font-semibold text-white mb-3">Recovery & Quality</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0f172a] rounded-xl p-3">
                <div className="text-xs text-slate-400 mb-1">Aerobic efficiency</div>
                <div className="text-lg font-bold text-blue-400">{summary.avgEfficiency.toFixed(4)}</div>
                <div className="text-xs text-slate-500">min/km/bpm</div>
              </div>
              {summary.avgHR && (
                <div className="bg-[#0f172a] rounded-xl p-3">
                  <div className="text-xs text-slate-400 mb-1">Avg heart rate</div>
                  <div className={`text-lg font-bold ${summary.avgHR < 140 ? "text-green-400" : "text-yellow-400"}`}>{summary.avgHR} bpm</div>
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <div className="text-sm font-semibold text-white mb-3">Runs</div>
          <div className="space-y-3">
            {runs.map((run) => <RunCard key={run.id} run={run} weekStart={weekStart} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
      <RefreshCw size={24} className="text-brand-orange animate-spin" />
    </div>
  );
}
