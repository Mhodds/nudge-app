import { useState } from "react"; // Added useState
import { Kick } from "@/types/session";
import { Grid3X3, Info } from "lucide-react"; // Added Info icon
import AngleInfoModal from "./AngleInfoModal";

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
  sessions?: any[];
  filter?: "aggregated" | "match" | "skill";
}

const EfficiencyMatrix = ({ sessions = [] }: Props) => {
  // 1. ADD VIEW STATE
  const [view, setView] = useState<'grid' | 'sectors' | 'range'>('grid');
  
  const allKicks: Kick[] = sessions.flatMap((s) => s.kicks || []);

  if (allKicks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-card-border bg-card py-10">
        <Grid3X3 className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="px-6 text-center font-display text-xs font-semibold tracking-wider text-muted-foreground">
          NO KICKS FOUND FOR THIS TIMEFRAME
        </p>
      </div>
    );
  }

  // 2. HELPER FOR NEW VIEWS
  const calcStats = (kicks: Kick[]) => {
    if (!kicks.length) return { pct: null, made: 0, total: 0 };
    const made = kicks.filter((k) => k.result === "made").length;
    return { 
      pct: Math.round((made / kicks.length) * 100), 
      made, 
      total: kicks.length 
    };
  };

  // Sector Buckets
  const sectorData = {
    LEFT: calcStats(allKicks.filter(k => ["SL-L", "5m-L", "15m-L"].includes(k.angle))),
    FRONT: calcStats(allKicks.filter(k => k.angle === "FR")),
    RIGHT: calcStats(allKicks.filter(k => ["15m-R", "5m-R", "SL-R"].includes(k.angle))),
  };

  // Range Buckets
  const rangeData = distBands.reduce((acc, band) => {
    acc[band] = calcStats(allKicks.filter(k => k.distance === band));
    return acc;
  }, {} as any);

  // Original Grid Buckets
  const buckets: Record<string, Kick[]> = {};
  for (const k of allKicks) {
    const key = `${k.distance}|${k.angle}`;
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(k);
  }

  return (
    <div className="space-y-4">
      {/* 3. UPDATED HEADER WITH TOGGLE (REMOVED INTERNAL H2) */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex p-1 bg-secondary/30 rounded-lg w-full max-w-[240px]">
          {['grid', 'sectors', 'range'].map((mode) => (
            <button
              key={mode}
              onClick={() => setView(mode as any)}
              className={`flex-1 py-1.5 rounded-md font-display text-[9px] font-black uppercase tracking-wider transition-all ${
                view === mode 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        <AngleInfoModal />
      </div>

      {/* 4. CONDITIONAL RENDERING */}
      {view === 'grid' && (
        <div className="overflow-x-auto rounded-xl border border-card-border bg-card animate-in fade-in duration-500">
          <table className="w-full" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr className="border-b border-card-border">
                <th className="px-2 py-2 w-16"></th>
                {angleCols.map((col, i) => (
                  <th key={`${col.key}-${i}`} className="px-1 py-2 text-center font-display text-[11px] font-bold tracking-wider text-foreground uppercase">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {distBands.map((band) => (
                <tr key={band} className="border-b border-card-border last:border-b-0">
                  <td className="px-2 py-2 font-display text-[11px] font-bold text-foreground whitespace-nowrap">{band}</td>
                  {angleCols.map((col, i) => {
                    const kicks = buckets[`${band}|${col.key}`];
                    const stats = calcStats(kicks || []);
                    const bg = getHeatColor(stats.pct);
                    const fg = getTextColor(stats.pct);
                    return (
                      <td key={`${col.key}-${i}`} className="px-0.5 py-1 text-center">
                        <div className="mx-auto flex w-full flex-col items-center justify-center rounded-md py-1.5 transition-colors" style={{ backgroundColor: bg }}>
                          {stats.pct !== null ? (
                            <>
                              <span className="font-display text-[11px] font-bold leading-tight" style={{ color: fg }}>{stats.pct}%</span>
                              <span className="font-mono text-[10px] leading-tight opacity-80" style={{ color: fg }}>{stats.made}/{stats.total}</span>
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
      )}

      {view === 'sectors' && (
        <div className="grid grid-cols-3 gap-2 h-32 animate-in zoom-in-95 duration-500">
          {Object.entries(sectorData).map(([label, stats]: [string, any]) => (
            <div 
              key={label} 
              className="flex flex-col items-center justify-center rounded-xl border border-card-border transition-all"
              style={{ backgroundColor: getHeatColor(stats.pct) }}
            >
              <span className="font-display text-[9px] font-black uppercase tracking-widest opacity-60 mb-1" style={{ color: getTextColor(stats.pct) }}>{label}</span>
              <span className="font-display text-2xl font-black italic tracking-tighter leading-none" style={{ color: getTextColor(stats.pct) }}>{stats.pct ?? 0}%</span>
              <span className="mt-1 font-mono text-[10px] font-bold opacity-70" style={{ color: getTextColor(stats.pct) }}>{stats.made}/{stats.total}</span>
            </div>
          ))}
        </div>
      )}

      {view === 'range' && (
        <div className="grid grid-cols-1 gap-2 animate-in slide-in-from-bottom-2 duration-500">
          {Object.entries(rangeData).map(([label, stats]: [string, any]) => (
            <div 
              key={label} 
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-card-border transition-all"
              style={{ backgroundColor: getHeatColor(stats.pct) }}
            >
              <span className="font-display text-[10px] font-black uppercase tracking-widest" style={{ color: getTextColor(stats.pct) }}>{label}</span>
              <div className="flex items-center gap-4">
                <span className="font-display text-2xl font-black italic tracking-tighter leading-none" style={{ color: getTextColor(stats.pct) }}>{stats.pct ?? 0}%</span>
                <span className="font-mono text-[10px] font-bold opacity-70" style={{ color: getTextColor(stats.pct) }}>{stats.made}/{stats.total}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EfficiencyMatrix;