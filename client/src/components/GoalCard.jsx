import { fmtTime, diffStr } from "../utils/format";
import { Target, TrendingUp, Zap } from "lucide-react";

export default function GoalCard({ goal }) {
  if (!goal) return null;
  const { hmGoalStr, predictedHMStr, predictedDiffSecs, hmCeilingStr, longRunKm, longRunTarget, weeksToRace, goalPaceStr, vo2max } = goal;

  const diffSecs  = predictedDiffSecs;
  const onTrack   = diffSecs !== null && diffSecs <= 0;
  const close     = diffSecs !== null && diffSecs > 0 && diffSecs < 300;
  const color     = onTrack ? "text-green-400" : close ? "text-yellow-400" : "text-red-400";
  const longOk    = longRunKm >= longRunTarget;
  const longClose = !longOk && longRunKm >= longRunTarget * 0.85;

  return (
    <div className="bg-[#1e293b] rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={18} className="text-brand-orange" />
          <span className="font-semibold text-white">Sub-1:45 Goal</span>
        </div>
        <span className="text-xs text-slate-400">{weeksToRace} weeks to race</span>
      </div>

      {/* Goal pace banner */}
      <div className="bg-[#0f172a] rounded-xl p-3 text-center">
        <div className="text-xs text-slate-400 mb-1">Target pace</div>
        <div className="text-3xl font-bold text-brand-orange">{goalPaceStr}<span className="text-lg text-slate-400">/km</span></div>
        <div className="text-xs text-slate-500 mt-1">sustained for 21.1 km</div>
      </div>

      {/* Predictions row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0f172a] rounded-xl p-3">
          <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
            <TrendingUp size={11} />Current fitness
          </div>
          <div className={`text-xl font-bold ${color}`}>{predictedHMStr ?? "–"}</div>
          {diffSecs !== null && (
            <div className={`text-xs mt-0.5 ${color}`}>{diffStr(diffSecs)} vs goal</div>
          )}
        </div>
        <div className="bg-[#0f172a] rounded-xl p-3">
          <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
            <Zap size={11} />VO₂max ceiling
          </div>
          <div className="text-xl font-bold text-blue-400">{hmCeilingStr ?? "–"}</div>
          <div className="text-xs text-slate-500 mt-0.5">VO₂max {vo2max}</div>
        </div>
      </div>

      {/* Long run progress */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
          <span>Long run</span>
          <span className={longOk ? "text-green-400" : longClose ? "text-yellow-400" : "text-red-400"}>
            {longRunKm} / {longRunTarget} km
          </span>
        </div>
        <div className="h-1.5 bg-[#0f172a] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${longOk ? "bg-green-400" : longClose ? "bg-yellow-400" : "bg-red-400"}`}
            style={{ width: `${Math.min(100, (longRunKm / longRunTarget) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
