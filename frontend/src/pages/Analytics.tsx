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
  const [timeframe, setTimeframe] = useState<"all" | "30d" | "3g">("all");

  const { data: sessions = [], isLoading } = useSessions();

  const calculateStats = (type: "match" | "training") => {
    const allHistory = sessions
      .filter(s => {
        const t = String(s.type || '').toLowerCase().trim();
        const isMatch = t === "match" || t === "game";
        return type === "match" ? isMatch : !isMatch;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let filteredSessions = [...allHistory].reverse(); 
    if (timeframe === "30d") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filteredSessions = filteredSessions.filter(s => new Date(s.timestamp) >= thirtyDaysAgo);
    } else if (timeframe === "3g") {
      filteredSessions = filteredSessions.slice(0, 3);
    }

    const activeKicks = filteredSessions.flatMap(s => s.kicks || []);
    
    const placeKicks = activeKicks.filter(k => {
      if (type === "match") return k.kickType === 'conversion' || k.kickType === 'penalty';
      return k.kickType !== 'try';
    });

    const madeKicks = placeKicks.filter(k => k.result === "made").length;
    const acc = placeKicks.length > 0 ? Math.round((madeKicks / placeKicks.length) * 100) : 0;
    
    const tries = filteredSessions.reduce((acc, s) => acc + (s.tries || 0), 0);
    const convos = activeKicks.filter(k => k.kickType === 'conversion' && k.result === 'made').length;
    const pens = activeKicks.filter(k => k.kickType === 'penalty' && k.result === 'made').length;

    const feels = filteredSessions
      .map(s => s.feel ?? s.avgFeel ?? s.rpe)
      .filter(f => f != null && !isNaN(Number(f)) && Number(f) > 0);

    const avgFeel = feels.length > 0 
      ? (feels.reduce((a, b) => Number(a) + Number(b), 0) / feels.length).toFixed(1) 
      : "—";

    let liveStreak = 0;
    let bestStreak = 0;
    let current = 0;
    const allTypeKicks = allHistory.flatMap(s => s.kicks || []).filter(k => {
       if (type === "match") return k.kickType === 'conversion' || k.kickType === 'penalty';
       return k.kickType !== 'try';
    });
    
    allTypeKicks.forEach(k => {
      if (k.result === 'made') {
        current++;
        if (current > bestStreak) bestStreak = current;
        liveStreak = current;
      } else {
        current = 0;
        liveStreak = 0;
      }
    });

    return { 
      acc: `${acc}%`, 
      strikeRate: `${madeKicks}/${placeKicks.length}`,
      ptsTotal: type === 'training' ? '—' : (tries * 5) + (convos * 2) + (pens * 3),
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
    const isMatch = t === "match" || t === "game";
    if (category === "match") return isMatch;
    if (category === "skill") return !isMatch;
    return true;
  })].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  let displaySessions = [...chartSessions];
  if (timeframe === "30d") {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    displaySessions = displaySessions.filter(s => new Date(s.timestamp) >= cutoff);
  } else if (timeframe === "3g") {
    displaySessions = displaySessions.slice(0, 3);
  }

  const allKicksInView = displaySessions.flatMap(s => s.kicks || []);
  const missedKicks = allKicksInView.filter(k => k.result === 'miss');
  
  const chartData = [
    { name: 'Pure', value: missedKicks.filter(k => k.technicalMiss?.toLowerCase() === 'pure').length },
    { name: 'Hook', value: missedKicks.filter(k => k.technicalMiss?.toLowerCase() === 'hook').length },
    { name: 'Push', value: missedKicks.filter(k => k.technicalMiss?.toLowerCase() === 'push').length },
    { name: 'Short', value: missedKicks.filter(k => k.technicalMiss?.toLowerCase() === 'short').length },
  ].filter(item => item.value > 0);

  return (
    <div className="min-h-screen bg-background pb-32 text-foreground">
      <div className="mx-auto max-w-md px-4">
        {/* BRANDED HEADER */}
        <div className="flex flex-col items-center pt-8 pb-4 relative text-center">
          <button onClick={() => navigate("/")} className="absolute left-0 top-8 text-muted-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-3xl font-black italic tracking-tighter uppercase leading-none">
            Nudge <span className="text-primary">Check</span>
          </h1>
          <p className="font-display text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mt-1">
            Kicking Performance Lab
          </p>
        </div>

        {/* FILTERS */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md py-4 border-b border-card-border/50 flex flex-col gap-3 mb-6">
          <div className="flex rounded-lg bg-secondary/30 p-1">
            {[{ id: "all", label: "Combined" }, { id: "match", label: "Matches" }, { id: "skill", label: "Training" }].map((t) => (
              <button key={t.id} onClick={() => setCategory(t.id as any)} className={`flex-1 rounded-md py-2 font-display text-[11px] font-black uppercase tracking-wider transition-all ${category === t.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground"}`}>{t.label}</button>
            ))}
          </div>
          <div className="flex rounded-lg bg-secondary/30 p-1">
            {[{ id: "all", label: "Season" }, { id: "30d", label: "30 Days" }, { id: "3g", label: "3 Games" }].map((t) => (
              <button key={t.id} onClick={() => setTimeframe(t.id as any)} className={`flex-1 rounded-md py-1.5 font-display text-[10px] font-black uppercase tracking-widest transition-all ${timeframe === t.id ? "bg-foreground text-background" : "text-muted-foreground"}`}>{t.label}</button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-96 w-full rounded-2xl" />
        ) : (
          <div className="flex flex-col gap-8">
            {/* KPI TABLE */}
            <div>
              <h2 className="mb-3 font-display text-xs font-black italic tracking-[0.2em] text-muted-foreground uppercase">Key Performance Indicators</h2>
              <div className="overflow-hidden rounded-2xl border border-card-border bg-card/30">
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-secondary/10">
                      <th className="p-4 font-display text-xs font-black uppercase tracking-widest text-muted-foreground border-b border-card-border">KPI</th>
                      <th className={`p-4 font-display text-xs font-black uppercase tracking-widest border-b border-card-border ${category !== 'skill' ? 'text-primary' : 'text-muted-foreground/30'}`}>Match</th>
                      <th className={`p-4 font-display text-xs font-black uppercase tracking-widest border-b border-card-border ${category !== 'match' ? 'text-pink-400' : 'text-muted-foreground/30'}`}>Training</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
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
                        <td className="p-4 text-muted-foreground text-[10px] tracking-[0.2em] font-display font-black uppercase border-b border-card-border/30">{row.label}</td>
                        <td className={`p-4 border-b border-card-border/30 font-mono font-bold text-sm ${category !== 'skill' ? 'text-primary' : 'text-foreground/10'}`}>
                          <div className="flex items-center gap-1.5">{row.m} {row.fire && Number(row.m) > 0 && <Flame className="h-3 w-3 fill-primary text-primary animate-pulse" />}</div>
                        </td>
                        <td className={`p-4 border-b border-card-border/30 font-mono font-bold text-sm ${category !== 'match' ? 'text-pink-400' : 'text-foreground/10'}`}>
                          <div className="flex items-center gap-1.5">{row.t} {row.fire && Number(row.t) > 0 && <Flame className="h-3 w-3 fill-pink-500 text-pink-500 animate-pulse" />}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* EFFICIENCY MATRIX */}
            <div>
              <h2 className="mb-3 font-display text-xs font-black italic tracking-[0.2em] text-muted-foreground uppercase">Efficiency Matrix</h2>
              <EfficiencyMatrix sessions={displaySessions} /> 
            </div>

            {/* MISS ANALYSIS WITH PILL */}
            {chartData.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-display text-xs font-black italic tracking-[0.2em] text-muted-foreground uppercase">Miss Analysis</h2>
                  <div className="rounded-full bg-secondary px-2.5 py-0.5 font-mono text-[9px] font-bold text-primary border border-primary/20">
                    {missedKicks.length} TOTAL
                  </div>
                </div>
                <MissAnalysisChart data={chartData} />
              </div>
            )}

            {/* VELOCITY GRAPH */}
            <div>
              <h2 className="mb-3 font-display text-xs font-black italic tracking-[0.2em] text-muted-foreground uppercase">Velocity Graph</h2>
              <VelocityGraph sessions={displaySessions} />
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Analytics;