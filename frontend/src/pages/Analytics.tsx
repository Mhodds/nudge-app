import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flame } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import VelocityGraph from "@/components/VelocityGraph";
import EfficiencyMatrix from "@/components/EfficiencyMatrix";
import MissAnalysisChart from "@/components/MissAnalysisChart";
import { useSessions } from "@/hooks/useSessions";
import { Skeleton } from "@/components/ui/skeleton";

const Analytics = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState<"all" | "match" | "skill">("all");
  const [timeframe, setTimeframe] = useState<"all" | "3" | "10">("all");

  const { data: sessions = [], isLoading } = useSessions();

  const calculateStats = (type: "match" | "training") => {
    const allHistory = sessions
      .filter(s => {
        const t = String(s.type || '').toLowerCase().trim();
        if (type === "match") return t === "match";
        return t === "training" || t === "skill";
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const historyKicks = allHistory.flatMap(s => s.kicks || []).filter(k => {
      if (type === 'training') return k.kickType !== 'try' && k.kickType !== 'drop_goal';
      return k.kickType === 'conversion' || k.kickType === 'penalty';
    });

    let liveStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    historyKicks.forEach(k => {
      if (k.result === 'made') {
        tempStreak++;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
        liveStreak = tempStreak;
      } else {
        tempStreak = 0;
        liveStreak = 0;
      }
    });

    const activeSessions = [...allHistory]
      .reverse() 
      .slice(0, timeframe === "all" ? undefined : parseInt(timeframe));

    const activeKicks = activeSessions.flatMap(s => s.kicks || []);
    const placeKicks = activeKicks.filter(k => {
      if (type === 'training') return k.kickType !== 'try' && k.kickType !== 'drop_goal';
      return k.kickType === 'conversion' || k.kickType === 'penalty';
    });

    const madeKicks = placeKicks.filter(k => k.result === 'made').length;
    const acc = placeKicks.length > 0 ? Math.round((madeKicks / placeKicks.length) * 100) : 0;
    
    const tries = activeSessions.reduce((acc, s) => acc + (s.tries || 0), 0);
    const convos = activeKicks.filter(k => k.kickType === 'conversion' && k.result === 'made').length;
    const pens = activeKicks.filter(k => k.kickType === 'penalty' && k.result === 'made').length;
    const dgs = activeKicks.filter(k => k.kickType === 'drop_goal' && k.result === 'made').length;

    const feels = activeSessions
      .map(s => s.feel ?? s.avgFeel ?? s.feelScale ?? s.rpe)
      .filter(f => f != null && !isNaN(Number(f)) && Number(f) > 0);

    const avgFeel = feels.length > 0 
      ? (feels.reduce((a, b) => Number(a) + Number(b), 0) / feels.length).toFixed(1) 
      : "N/A";

    return { 
      acc: `${acc}%`, 
      strikeRate: `${madeKicks}/${placeKicks.length}`,
      ptsTotal: type === 'training' ? '—' : (tries * 5) + (convos * 2) + (pens * 3) + (dgs * 3),
      bootValue: type === 'training' ? '—' : (convos * 2) + (pens * 3),
      feel: `${avgFeel}/5`,
      liveStreak,
      bestStreak
    };
  };

  const matchStats = calculateStats("match");
  const trainStats = calculateStats("training");

  const chartSessions = [...sessions.filter(s => {
    const t = String(s.type || '').toLowerCase().trim();
    if (category === "match") return t === "match";
    if (category === "skill") return t === "training" || t === "skill";
    return true;
  })].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
     .slice(0, timeframe === "all" ? undefined : parseInt(timeframe));

  const missedKicks = chartSessions.flatMap(s => s.kicks || []).filter(k => k.result === 'miss');
  const chartData = [
    { name: 'Pure', value: missedKicks.filter(k => k.technicalMiss?.toLowerCase() === 'pure').length },
    { name: 'Hook', value: missedKicks.filter(k => k.technicalMiss?.toLowerCase() === 'hook').length },
    { name: 'Push', value: missedKicks.filter(k => k.technicalMiss?.toLowerCase() === 'push').length },
    { name: 'Short', value: missedKicks.filter(k => k.technicalMiss?.toLowerCase() === 'short').length },
  ].filter(item => item.value > 0);

  return (
    <div className="min-h-screen bg-background pb-32 text-foreground">
      <div className="mx-auto max-w-md px-4">
        {/* Header */}
        <div className="flex items-center justify-center pt-6 pb-2 relative">
          <button onClick={() => navigate("/")} className="absolute left-0 top-6"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="font-display text-xl font-black italic tracking-wider uppercase italic">Data <span className="text-primary">Audit</span></h1>
        </div>

        {/* FILTERS */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md py-4 border-b border-card-border/50 flex flex-col gap-3 mb-6">
          <div className="flex rounded-lg bg-secondary/50 p-1">
            {[{ id: "all", label: "Combined" }, { id: "match", label: "Matches" }, { id: "skill", label: "Training" }].map((t) => (
              <button key={t.id} onClick={() => setCategory(t.id as any)} className={`flex-1 rounded-md py-2 font-display text-[10px] font-black uppercase tracking-wider transition-all ${category === t.id ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(34,211,238,0.3)]" : "text-muted-foreground"}`}>{t.label}</button>
            ))}
          </div>
          <div className="flex rounded-lg bg-secondary/50 p-1">
            {[{ id: "all", label: "Season" }, { id: "10", label: "Last 10" }, { id: "3", label: "Last 3" }].map((t) => (
              <button key={t.id} onClick={() => setTimeframe(t.id as any)} className={`flex-1 rounded-md py-1.5 font-display text-[9px] font-black uppercase tracking-widest transition-all ${timeframe === t.id ? "bg-foreground text-background shadow-md" : "text-muted-foreground"}`}>{t.label}</button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-96 w-full rounded-2xl" />
        ) : (
          <div className="flex flex-col gap-8">
            {/* KPI TABLE SECTION */}
            <div>
              <h2 className="mb-3 font-display text-[10px] font-black italic tracking-[0.2em] text-muted-foreground uppercase">Key Performance Indicators</h2>
              <div className="overflow-hidden rounded-2xl border border-card-border bg-card/30">
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-secondary/20">
                      <th className="p-4 font-display text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-card-border">KPI</th>
                      <th className={`p-4 font-display text-[10px] font-black uppercase tracking-widest border-b border-card-border transition-all duration-300 ${category === 'match' || category === 'all' ? 'text-primary' : 'text-muted-foreground/30'}`}>Match</th>
                      <th className={`p-4 font-display text-[10px] font-black uppercase tracking-widest border-b border-card-border transition-all duration-300 ${category === 'skill' || category === 'all' ? 'text-pink-400' : 'text-muted-foreground/30'}`}>Training</th>
                    </tr>
                  </thead>
                  <tbody className="font-display text-xs font-black uppercase italic tracking-tight">
                    {[
                      { label: "Accuracy %", m: matchStats.acc, t: trainStats.acc },
                      { label: "Strike Rate", m: matchStats.strikeRate, t: trainStats.strikeRate },
                      { label: "Pts Total", m: matchStats.ptsTotal, t: "—" },
                      { label: "Boot Value", m: matchStats.bootValue, t: "—" },
                      { label: "Live Streak", m: matchStats.liveStreak, t: trainStats.liveStreak, fire: true },
                      { label: "Best Streak", m: matchStats.bestStreak, t: trainStats.bestStreak },
                      { label: "Kick Feel", m: matchStats.feel, t: trainStats.feel },
                    ].map((row, i) => (
                      <tr key={i}>
                        <td className="p-4 text-muted-foreground text-[8px] tracking-[0.2em] font-black border-b border-card-border/30">{row.label}</td>
                        <td className={`p-4 border-b border-card-border/30 ${category === 'match' || category === 'all' ? 'bg-primary/5 text-primary' : 'text-foreground/20'}`}>
                          <div className="flex items-center gap-1.5">{row.m} {row.fire && row.m > 0 && <Flame className="h-3 w-3 fill-primary animate-pulse" />}</div>
                        </td>
                        <td className={`p-4 border-b border-card-border/30 ${category === 'skill' || category === 'all' ? 'bg-pink-500/5 text-pink-400' : 'text-foreground/20'}`}>
                          <div className="flex items-center gap-1.5">{row.t} {row.fire && row.t > 0 && <Flame className="h-3 w-3 fill-pink-500 animate-pulse" />}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CHARTS SECTIONS */}
            <div>
              <h2 className="mb-3 font-display text-[10px] font-black italic tracking-[0.2em] text-muted-foreground uppercase">Efficiency Matrix</h2>
              {/* THIS IS THE LINE THAT FIXED IT */}
              <EfficiencyMatrix sessions={chartSessions} /> 
            </div>

            {chartData.length > 0 && (
              <div>
                <h2 className="mb-3 font-display text-[10px] font-black italic tracking-[0.2em] text-muted-foreground uppercase">Miss Analysis</h2>
                <MissAnalysisChart data={chartData} />
              </div>
            )}

            <div>
              <h2 className="mb-3 font-display text-[10px] font-black italic tracking-[0.2em] text-muted-foreground uppercase">Velocity Graph</h2>
              <VelocityGraph sessions={chartSessions} />
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Analytics;