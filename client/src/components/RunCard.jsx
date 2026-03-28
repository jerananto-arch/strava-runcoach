import { useNavigate } from "react-router-dom";
import { fmtTime, fmtDate, ZONE_COLORS } from "../utils/format";
import { Heart, Footprints, ArrowRight } from "lucide-react";

export default function RunCard({ run, weekStart }) {
  const nav = useNavigate();

  const hrColor = run.avgHR
    ? run.avgHR < 140 ? "text-green-400" : run.avgHR < 158 ? "text-yellow-400" : "text-red-400"
    : "text-slate-400";

  return (
    <button
      onClick={() => nav(`/week/${weekStart}/run/${run.id}`)}
      className="w-full bg-[#1e293b] rounded-2xl p-4 text-left active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-semibold text-white text-sm">{run.name}</div>
          <div className="text-xs text-slate-400 mt-0.5">{fmtDate(run.date)}</div>
        </div>
        <ArrowRight size={16} className="text-slate-600 mt-1" />
      </div>

      {/* Key stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <div className="text-xs text-slate-500">Distance</div>
          <div className="text-base font-bold text-white">{run.distKm} <span className="text-xs font-normal text-slate-400">km</span></div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Pace</div>
          <div className="text-base font-bold text-white">{run.avgPace} <span className="text-xs font-normal text-slate-400">/km</span></div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Time</div>
          <div className="text-base font-bold text-white">{fmtTime(run.movingTime)}</div>
        </div>
      </div>

      {/* HR + cadence chips */}
      <div className="flex gap-2 flex-wrap">
        {run.avgHR && (
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-[#0f172a] ${hrColor}`}>
            <Heart size={10} /> {run.avgHR} bpm · {run.hrZone}
          </div>
        )}
        {run.cadence && (
          <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-[#0f172a] text-slate-300">
            <Footprints size={10} /> {run.cadence} spm
          </div>
        )}
        {run.hrDrift !== null && (
          <div className={`text-xs px-2 py-1 rounded-full bg-[#0f172a] ${Math.abs(run.hrDrift) <= 5 ? "text-green-400" : Math.abs(run.hrDrift) <= 12 ? "text-yellow-400" : "text-red-400"}`}>
            HR drift +{run.hrDrift}
          </div>
        )}
      </div>

      {/* Mini split sparkline */}
      {run.splits?.length > 2 && (
        <div className="mt-3 flex items-end gap-0.5 h-6">
          {run.splits.slice(0, -1).map((s, i) => {
            const zone = s.zone || "Z2";
            const pct  = s.paceSeconds ? Math.min(100, Math.max(10, 100 - ((s.paceSeconds - 270) / 300) * 100)) : 50;
            return (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{ height: `${pct}%`, background: ZONE_COLORS[zone] || "#64748b", opacity: 0.8 }}
              />
            );
          })}
        </div>
      )}
    </button>
  );
}
