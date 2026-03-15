import { Flame, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useMatchStats, useSessions } from "@/hooks/useSessions";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

const RecentFormCard = ({ s }: { s: ReturnType<typeof useMatchStats> }) => {
  const [showTip, setShowTip] = useState(false);
  const hasDelta = s.formDelta !== null;
  const Icon = s.formDelta! > 0 ? TrendingUp : s.formDelta! < 0 ? TrendingDown : Minus;
  const colorClass = s.formDelta! > 0 ? "text-green-400" : s.formDelta! < 0 ? "text-red-400" : "text-muted-foreground";
  const sign = s.formDelta! > 0 ? "+" : "";

  return (
    <div
      className="relative flex flex-col items-center rounded-xl border border-card-border bg-card px-3 py-4 cursor-pointer select-none"
      onClick={() => setShowTip((p) => !p)}
    >
      {/* Label - Changed to font-body */}
      <span className="font-body text-[12px] font-semibold tracking-widest text-muted-foreground text-center leading-tight">
        RECENT<br />FORM
      </span>
      
      {/* Big Number - Kept as font-display */}
      <span className="mt-2 font-display text-3xl font-bold text-stat-value">{s.recentForm}%</span>
      
      {/* Tiny Badge - Changed to font-body */}
      {hasDelta ? (
        <span className={`mt-2 inline-flex items-center gap-1 font-body text-xs font-bold ${colorClass}`}>
          <Icon className="h-3 w-3" /> {sign}{s.formDelta}%
        </span>
      ) : (
        <span className="mt-2 font-body text-xs font-semibold text-muted-foreground tracking-wider">LAST 3</span>
      )}

      {showTip && (
        <div className="absolute -bottom-16 left-1/2 z-20 w-52 -translate-x-1/2 rounded-lg border border-card-border bg-card px-3 py-2 shadow-lg animate-in fade-in-0 zoom-in-95 duration-150">
          <p className="text-center font-body text-[11px] leading-tight text-muted-foreground">
            Accuracy across your last 3 matches. Trend shows change vs the previous 3-match window.
          </p>
        </div>
      )}
    </div>
  );
};

const StatsCards = () => {
  const s = useMatchStats();
  const { isLoading } = useSessions();

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3 px-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center rounded-xl border border-card-border bg-card px-3 py-4">
            <Skeleton className="h-3 w-14 rounded" />
            <Skeleton className="mt-3 h-8 w-12 rounded" />
            <Skeleton className="mt-3 h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 px-4">
      {/* Season Acc */}
      <div className="flex flex-col items-center rounded-xl border border-card-border bg-card px-3 py-4">
        <span className="font-body text-[12px] font-semibold tracking-widest text-muted-foreground text-center leading-tight">
          SEASON<br />ACC
        </span>
        <span className="mt-2 font-display text-3xl font-bold text-stat-value">{s.seasonAcc}%</span>
        <span className="mt-2 rounded-full bg-primary px-3 py-0.5 font-body text-xs font-bold text-primary-foreground">
          {s.totalMade}/{s.totalKicks}
        </span>
      </div>

      {/* Recent Form */}
      <RecentFormCard s={s} />

      {/* Live Streak */}
      <div className="flex flex-col items-center rounded-xl border border-card-border bg-card px-3 py-4">
        <span className="font-body text-[12px] font-semibold tracking-widest text-muted-foreground text-center leading-tight">
          LIVE<br />STREAK
        </span>
        <div className="mt-2 flex items-center gap-1">
          <Flame className="h-6 w-6 text-streak-fire" />
          <span className="font-display text-3xl font-bold text-foreground">{s.liveStreak}</span>
        </div>
        <span className="mt-2 rounded-full bg-primary px-3 py-0.5 font-body text-xs font-bold text-primary-foreground tracking-wide">
          BEST: {s.bestStreak}
        </span>
      </div>
    </div>
  );
};

export default StatsCards;