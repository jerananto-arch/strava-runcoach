import { useNavigate } from "react-router-dom";
import { useReports } from "../hooks/useReports";
import { VolumeChart, FitnessChart, EfficiencyChart, CadenceChart } from "../components/TrendCharts";
import { ArrowLeft, RefreshCw } from "lucide-react";

export default function Trends() {
  const nav = useNavigate();
  const { reports, loading } = useReports();

  if (loading) return <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center"><RefreshCw size={24} className="text-brand-orange animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#0a0f1e] pb-24 safe-top">
      <div className="px-4 pt-6 pb-4 sticky top-0 bg-[#0a0f1e] z-10 border-b border-slate-800/50">
        <button onClick={() => nav(-1)} className="flex items-center gap-2 text-slate-400 mb-3">
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-lg font-bold text-white">Training Trends</h1>
        <div className="text-xs text-slate-500">26-week progression to October</div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {reports.length < 2 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            Trends will appear after your second weekly report.
          </div>
        ) : (
          <>
            <VolumeChart reports={reports} />
            <FitnessChart reports={reports} />
            <EfficiencyChart reports={reports} />
            <CadenceChart reports={reports} />
          </>
        )}
      </div>
    </div>
  );
}
