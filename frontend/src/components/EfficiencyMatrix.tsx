import { useSessions } from "@/hooks/useSessions";
import { Kick } from "@/types/session";
import { Grid3X3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const distBands = ["0-22m", "22-30m", "30-40m", "40+m"];
const angleCols = [
  { key: "SL-L", label: "SL" },
  { key: "5m-L", label: "5M" },
  { key: "15m-L", label: "15M" },
  { key: "FR", label: "FR" },
  { key: "15m-R", label: "15M" },
  { key: "5m-R", label: "5M" },
  { key: "SL-R", label: "SL" },
];

function getHeatColor(pct: number | null): string {
  if (pct === null) return "hsl(220, 30%, 16%)";
  if (pct >= 85) return "hsl(190, 100%, 50%)";
  if (pct >= 40) return "hsl(220, 20%, 28%)";
  return "hsl(340, 85%, 55%)";
}

function getTextColor(pct: number | null): string {
  if (pct === null) return "hsl(210, 15%, 35%)";
  if (pct >= 85) return "hsl(220, 25%, 10%)";
  return "hsl(190, 100%, 95%)";
}

interface Props {
  filter: "aggregated" | "match" | "skill";
}

const EfficiencyMatrix = ({ filter }: Props) => {
  const { data: allSessions = [], isLoading } = useSessions();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-card-border bg-card p-4">
        <div className="grid grid-cols-8 gap-1">
          {Array.from({ length: 32 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-10 rounded-md" />
          ))}
        </div>
      </div>
    );
  }
  const sessions = allSessions.filter((s) => {
    if (filter === "match") return s.type === "match";
    if (filter === "skill") return s.type === "training";
    return true;
  });

  const allKicks: Kick[] = sessions.flatMap((s) => s.kicks);

  if (allKicks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-card-border bg-card py-10">
        <Grid3X3 className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="px-6 text-center font-display text-xs font-semibold tracking-wider text-muted-foreground">
          LOG YOUR FIRST SESSION TO BUILD YOUR EFFICIENCY MATRIX
        </p>
      </div>
    );
  }

  const buckets: Record<string, Kick[]> = {};
  for (const k of allKicks) {
    const key = `${k.distance}|${k.angle}`;
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(k);
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-card-border bg-card">
      <table className="w-full" style={{ tableLayout: "fixed" }}>
        <thead>
          <tr className="border-b border-card-border">
            <th className="px-2 py-2"></th>
            {angleCols.map((col, i) => (
              <th key={`${col.key}-${i}`} className="px-1 py-2 text-center font-display text-[11px] font-bold tracking-wider text-foreground">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {distBands.map((band) => (
            <tr key={band} className="border-b border-card-border last:border-b-0">
              <td className="px-2 py-2 font-display text-[12px] font-bold text-foreground">{band}</td>
              {angleCols.map((col, i) => {
                const kicks = buckets[`${band}|${col.key}`];
                const total = kicks?.length ?? 0;
                const made = kicks?.filter((k) => k.result === "made").length ?? 0;
                const pct = total > 0 ? Math.round((made / total) * 100) : null;
                const bg = getHeatColor(pct);
                const fg = getTextColor(pct);
                return (
                  <td key={`${col.key}-${i}`} className="px-0.5 py-1 text-center">
                    <div className="mx-auto flex w-full flex-col items-center justify-center rounded-md py-1.5 transition-colors" style={{ backgroundColor: bg }}>
                      {pct !== null ? (
                        <>
                          <span className="font-display text-[11px] font-bold leading-tight" style={{ color: fg }}>{pct}%</span>
                          <span className="font-mono text-[11px] leading-tight" style={{ color: fg }}>{made}/{total}</span>
                        </>
                      ) : (
                        <span className="font-display text-[11px]" style={{ color: fg }}>—</span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EfficiencyMatrix;
