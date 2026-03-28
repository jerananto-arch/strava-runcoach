import { ZONE_COLORS, ZONE_LABELS } from "../utils/format";

export default function ZoneBar({ zoneDist, easyPct }) {
  const total = Object.values(zoneDist).reduce((a, b) => a + b, 0);
  if (!total) return null;

  const zones = Object.entries(zoneDist).filter(([, km]) => km > 0);

  return (
    <div className="space-y-2">
      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden gap-px">
        {zones.map(([z, km]) => (
          <div
            key={z}
            style={{ width: `${(km / total) * 100}%`, background: ZONE_COLORS[z] }}
            title={`${z} ${ZONE_LABELS[z]}: ${km.toFixed(1)} km`}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {zones.map(([z, km]) => (
          <div key={z} className="flex items-center gap-1 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: ZONE_COLORS[z] }} />
            <span>{z}</span>
            <span className="text-slate-500">{Math.round((km / total) * 100)}%</span>
          </div>
        ))}
      </div>
      {easyPct !== undefined && (
        <div className={`text-xs font-medium ${easyPct >= 75 ? "text-green-400" : easyPct >= 60 ? "text-yellow-400" : "text-red-400"}`}>
          {easyPct}% easy (Z1+Z2) · target 80%
        </div>
      )}
    </div>
  );
}
