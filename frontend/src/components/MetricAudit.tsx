import { Trophy, Calendar, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface MetricAuditProps {
  sessions: any[];
}

const MetricAudit = ({ sessions }: MetricAuditProps) => {
  
  // --- THE STRICTOR GOLDEN BOOT ENGINE ---
  const getGoldenBootId = () => {
    // 1. Force lowercase and strictly filter for 'match' sessions only
    const matchSessions = sessions.filter(s => {
      const type = String(s.type || '').toLowerCase().trim();
      return type === 'match';
    });
    
    if (matchSessions.length === 0) return null;

    // 2. Map accuracy and volume for MATCHES ONLY
    const matchAccuracies = matchSessions.map(s => {
      const placeKicks = s.kicks?.filter((k: any) => 
        k.kickType === 'conversion' || k.kickType === 'penalty'
      ) || [];
      const made = placeKicks.filter((k: any) => k.result === 'made').length;
      const acc = placeKicks.length > 0 ? (made / placeKicks.length) : 0;
      return { id: s.id, acc, volume: placeKicks.length };
    });

    // 3. Find the undisputed winner (Best accuracy, then volume)
    const bestMatch = matchAccuracies.reduce((best, current) => {
      if (!best || current.acc > best.acc) return current;
      if (current.acc === best.acc && current.volume > best.volume) return current;
      return best;
    }, null as any);

    return bestMatch && bestMatch.acc > 0 ? bestMatch.id : null;
  };

  const goldenBootId = getGoldenBootId();

  return (
    <div className="flex flex-col gap-3">
      <h2 className="mb-1 font-display text-[10px] font-black italic tracking-[0.2em] text-muted-foreground uppercase">
        Session History
      </h2>
      
      {sessions.map((session) => {
        const placeKicks = session.kicks?.filter((k: any) => k.kickType !== 'try' && k.kickType !== 'drop_goal') || [];
        const made = placeKicks.filter((k: any) => k.result === 'made').length;
        const accuracy = placeKicks.length > 0 ? Math.round((made / placeKicks.length) * 100) : 0;
        
        // Ensure type check here matches the engine logic
        const sessionType = String(session.type || '').toLowerCase().trim();
        const isMatch = sessionType === 'match';
        const isGoldenBoot = isMatch && session.id === goldenBootId;

        return (
          <div 
            key={session.id}
            className={`group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 ${
              isGoldenBoot 
                ? 'border-yellow-500/50 bg-yellow-500/10 shadow-[0_0_20px_rgba(234,179,8,0.15)]' 
                : 'border-card-border bg-card/40'
            }`}
          >
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider ${
                    isMatch ? 'bg-primary/20 text-primary' : 'bg-pink-500/20 text-pink-400'
                  }`}>
                    {isMatch ? 'Match' : 'Train'}
                  </span>
                  <h3 className="font-display text-xs font-black uppercase italic tracking-wide text-foreground">
                    {session.teamName || session.drillName || "Technical Drill"}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase">
                  <Calendar className="h-2.5 w-2.5" />
                  {format(new Date(session.timestamp), "dd MMM • HH:mm")}
                </div>
              </div>

              <div className="flex items-center gap-4">
                {isGoldenBoot && (
                  <div className="flex items-center gap-1.5 rounded-full bg-yellow-500 px-3 py-1 shadow-[0_0_15px_rgba(234,179,8,0.4)] animate-pulse">
                    <Trophy className="h-3 w-3 fill-black text-black" />
                    <span className="font-display text-[9px] font-black uppercase tracking-tighter text-black">Golden Boot</span>
                  </div>
                )}
                
                <div className="text-right">
                  <div className={`font-display text-xl font-black italic leading-none ${
                    accuracy >= 80 ? 'text-primary' : accuracy >= 50 ? 'text-yellow-500' : 'text-foreground/50'
                  }`}>
                    {accuracy}%
                  </div>
                  <div className="mt-1 text-[9px] font-bold uppercase tracking-tighter text-muted-foreground">
                    {made}/{placeKicks.length}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/30 transition-colors group-hover:text-primary" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MetricAudit;