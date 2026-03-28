export default function StatCard({ label, value, sub, accent, icon: Icon }) {
  return (
    <div className="bg-[#1e293b] rounded-2xl p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wider">
        {Icon && <Icon size={12} />}
        {label}
      </div>
      <div className={`text-2xl font-bold ${accent || "text-white"}`}>{value ?? "–"}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}
