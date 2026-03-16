import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, BarChart3 } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import VelocityGraph from "@/components/VelocityGraph";
import EfficiencyMatrix from "@/components/EfficiencyMatrix";
import MetricAudit from "@/components/MetricAudit";
import MissAnalysisChart from "@/components/MissAnalysisChart";
import { useSessions } from "@/hooks/useSessions";
import { Skeleton } from "@/components/ui/skeleton";

const Analytics = () => {
  const navigate = useNavigate();
  const [dataTab, setDataTab] = useState<"aggregated" | "match" | "skill">("aggregated");
  const { data: sessions = [], isLoading } = useSessions();

  const hasData = sessions.length > 0;

  // --- MASTER FILTERED DATA ---
  // This single filter now powers the Matrix, the DNA, AND the Velocity Graph
  const filteredSessions = sessions.filter((s: any) => {
    if (dataTab === "aggregated") return true;
    if (dataTab === "match") return s.type === "match";
    if (dataTab === "skill") return s.type === "training";
    return true;
  });

  const allKicks = filteredSessions.flatMap((session: any) => session.kicks || []);
  const missedKicks = allKicks.filter((kick: any) => kick.result === "miss");

  const chartData = [
    { name: 'Pure', value: missedKicks.filter((k: any) => k.technicalMiss?.toLowerCase() === 'pure').length },
    { name: 'Hook', value: missedKicks.filter((k: any) => k.technicalMiss?.toLowerCase() === 'hook').length },
    { name: 'Push', value: missedKicks.filter((k: any) => k.technicalMiss?.toLowerCase() === 'push').length },
    { name: 'Short', value: missedKicks.filter((k: any) => k.technicalMiss?.toLowerCase() === 'short').length },
  ].filter(item => item.value > 0); 

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="flex items-center justify-center px-4 pt-6 pb-4">
          <button onClick={() => navigate("/")} className="absolute left-4">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-xl font-black italic tracking-wider">
            DATA <span className="text-primary">AUDIT</span>
          </h1>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-6 px-4">
            <Skeleton className="h-52 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-52 w-full rounded-2xl" />
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
            <BarChart3 className="h-10 w-10 text-primary/40 mb-4" />
            <h2 className="font-display text-sm font-black italic tracking-wider">NO DATA YET</h2>
          </div>
        ) : (
          <div className="flex flex-col gap-8 px-4">
            
            {/* 1. MASTER TOGGLE & EFFICIENCY MATRIX */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-xs font-black italic tracking-widest text-muted-foreground uppercase">
                  Efficiency Matrix
                </h2>
                {/* Visual indicator of what filter is active */}
                <span className="text-[10px] font-black text-primary uppercase italic">
                   {dataTab === 'aggregated' ? 'Global View' : dataTab === 'match' ? 'Match Mode' : 'Training Mode'}
                </span>
              </div>
              
              <EfficiencyMatrix filter={dataTab} />
              
              <div className="mt-4 flex rounded-lg bg-secondary p-1">
                {["aggregated", "match", "skill"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDataTab(tab as any)}
                    className={`flex-1 rounded-md py-2 font-display text-[10px] font-bold uppercase tracking-wider transition-all ${
                      dataTab === tab ? "bg-foreground text-background shadow-lg" : "text-muted-foreground"
                    }`}
                  >
                    {tab === "skill" ? "Training" : tab === "match" ? "Match Day" : "All Time"}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. TECHNICAL DNA (Filtered) */}
            {chartData.length > 0 && (
              <div>
                <h2 className="mb-3 font-display text-xs font-black italic tracking-widest text-muted-foreground uppercase">
                  Technical DNA
                </h2>
                <MissAnalysisChart data={chartData} />
              </div>
            )}

            {/* 3. PERFORMANCE VELOCITY (Filtered) */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-xs font-black italic tracking-widest text-muted-foreground uppercase">
                  Performance Velocity
                </h2>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              {/* Note: We pass the filtered sessions directly to the graph if it supports it, 
                  or the graph component might already be hooked into the same state. */}
              <VelocityGraph sessions={filteredSessions} />
            </div>

            {/* 4. SESSION ARCHIVE */}
            <div>
              <h2 className="mb-3 font-display text-xs font-black italic tracking-widest text-muted-foreground uppercase">
                Session Archive
              </h2>
              <MetricAudit sessions={filteredSessions} />
            </div>

          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Analytics;