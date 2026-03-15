import { useSessions } from "@/hooks/useSessions";
import { Kick } from "@/types/session";
import { ClipboardList } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function computePileStats(kicks: Kick[], type: "match" | "training") {
  let ptsTotal: string;
  let ptsKicked: string;
  if (type === "match") {
    const madeKicks = kicks.filter((k) => k.result === "made");
    ptsTotal = String(
      madeKicks.reduce((sum, k) => {
        if (k.kickType === "try") return sum + 5;
        if (k.kickType === "drop_goal") return sum + 3;
        if (k.kickType === "penalty") return sum + 3;
        if (k.kickType === "conversion") return sum + 2;
        return sum;
      }, 0)
    );
    ptsKicked = String(
      madeKicks.reduce((sum, k) => {
        if (k.kickType === "penalty") return sum + 3;
        if (k.kickType === "conversion") return sum + 2;
        return sum;
      }, 0)
    );
  } else {
    ptsTotal = "N/A";
    ptsKicked = "N/A";
  }

  const placeKicks = kicks.filter((k) => k.kickType !== "try" && k.kickType !== "drop_goal");
  const made = placeKicks.filter((k) => k.result === "made");
  const total = placeKicks.length;
  const madeCount = made.length;
  const volume = `${madeCount}/${total}`;
  const accuracy = total > 0 ? `${Math.round((madeCount / total) * 100)}%` : "0%";
  const feelsWithValue = placeKicks.filter((k) => k.feel && k.feel > 0);
  const avgFeel =
    feelsWithValue.length > 0
      ? (feelsWithValue.reduce((s, k) => s + (k.feel || 0), 0) / feelsWithValue.length).toFixed(1)
      : "0.0";

  let activeStreak = 0;
  for (let i = placeKicks.length - 1; i >= 0; i--) {
    if (placeKicks[i].result === "made") activeStreak++;
    else break;
  }

  let bestStreak = 0;
  let current = 0;
  for (const k of placeKicks) {
    if (k.result === "made") {
      current++;
      if (current > bestStreak) bestStreak = current;
    } else {
      current = 0;
    }
  }

  return { ptsTotal, ptsKicked, volume, accuracy, avgFeel: `${avgFeel}/5`, activeStreak: String(activeStreak), bestStreak: String(bestStreak) };
}

const MetricAudit = () => {
  const { data: sessions = [], isLoading } = useSessions();

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-card-border bg-card">
        <div className="border-b border-card-border bg-secondary/40 px-4 py-3">
          <Skeleton className="h-4 w-full rounded" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b border-card-border px-4 py-3 last:border-b-0">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="ml-auto h-4 w-12 rounded" />
            <Skeleton className="h-4 w-12 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-card-border bg-card py-10">
        <ClipboardList className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="px-6 text-center font-display text-xs font-semibold tracking-wider text-muted-foreground">
          COMPLETE A SESSION TO START YOUR METRIC AUDIT
        </p>
      </div>
    );
  }

  const matchSessions = sessions
    .filter((s) => s.type === "match")
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const skillSessions = sessions
    .filter((s) => s.type === "training")
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const matchKicks = matchSessions.flatMap((s) => s.kicks);
  const skillKicks = skillSessions.flatMap((s) => s.kicks);

  const m = computePileStats(matchKicks, "match");
  const s = computePileStats(skillKicks, "training");

  const rows = [
    { kpi: "PTS TOTAL", match: m.ptsTotal, skill: s.ptsTotal, highlight: true },
    { kpi: "PTS KICKED", match: m.ptsKicked, skill: s.ptsKicked, highlight: true },
    { kpi: "TOTAL VOLUME", match: m.volume, skill: s.volume, highlight: false },
    { kpi: "ACCURACY", match: m.accuracy, skill: s.accuracy, highlight: true },
    { kpi: "AVG FEEL", match: m.avgFeel, skill: s.avgFeel, highlight: false },
    { kpi: "ACTIVE STREAK", match: m.activeStreak, skill: s.activeStreak, highlight: false },
    { kpi: "SEASON BEST", match: m.bestStreak, skill: s.bestStreak, highlight: true },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-card-border bg-card shadow-lg">
      <table className="w-full">
        <thead>
          <tr className="border-b border-card-border bg-secondary/40">
            <th className="px-4 py-3 text-left font-display text-xs font-bold tracking-wider text-muted-foreground">KPI</th>
            <th className="px-4 py-3 text-center font-display text-xs font-bold tracking-wider text-primary">MATCH</th>
            <th className="px-4 py-3 text-center font-display text-xs font-bold tracking-wider text-muted-foreground">TRAINING</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.kpi} className={`border-b border-card-border last:border-b-0 ${row.highlight ? "bg-primary/[0.08]" : ""}`}>
              <td className="px-4 py-3 font-display text-xs font-bold tracking-wider text-foreground">{row.kpi}</td>
              <td className="px-4 py-3 text-center font-display text-sm font-bold text-foreground">{row.match}</td>
              <td className="px-4 py-3 text-center font-display text-sm font-bold text-muted-foreground">{row.skill}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MetricAudit;
