import { useState, useMemo } from "react";
import { Kick } from "@/types/session";
import { Grid3X3 } from "lucide-react"; 
import AngleInfoModal from "./AngleInfoModal";

// --- 1. LEGACY DATA ADAPTER ---
// This ensures that if you have old kicks saved as "SIDE-L", 
// they still show up under the new "SL-L" grid boxes.
const normalizeAngle = (angle: string): string => {
  const map: Record<string, string> = {
    "SIDE-L": "SL-L",
    "SIDE-R": "SL-R",
    "I5M-L": "15m-L", // Fixing potential typos from old versions
    "I5M-R": "15m-R",
  };
  return map[angle] || angle;
};

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
  if (pct >= 85) return "hsl(190, 100%, 50%)"; // Pro-Cyan
  if (pct >= 40) return "hsl(220, 20%, 28%)"; // Neutral Grey-Blue
  return "hsl(340, 85%, 55%)"; // Warning Pink
}

function getTextColor(pct: number | null): string {
  if (pct === null) return "hsl(210, 15%, 35%)";
  if (pct >= 85) return "hsl(220, 25%, 10%)"; // Dark text on bright cyan
  return "hsl(190, 100%, 95%)"; // Light text on dark pink/grey
}

interface Props {
  sessions?: any[];
}

const EfficiencyMatrix = ({ sessions = [] }: Props) => {
  const [view, setView] = useState<'grid' | 'sectors' | 'range'>('grid');
  
  // --- 2. NORMALIZE KICKS ON LOAD ---
  const allKicks: Kick[] = useMemo(() => {
    return sessions.flatMap((s) => s.kicks || []).map(k => ({
      ...k,
      angle: normalizeAngle(k.angle)
    }));
  }, [sessions]);

  if (allKicks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-card-border bg-card py-10">
        <Grid3X3 className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="px-6 text-center font-display text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase italic">
          No data available for this selection
        </p>
      </div>
    );
  }

  const calcStats = (kicks: Kick[]) => {
    if (!kicks.length) return { pct: null, made: 0, total: 0 };
    const made = kicks.filter((k) => k.result === "made").length;
    return { 
      pct: Math.round((made / kicks.length) * 100), 
      made, 
      total: kicks.length 
    };
  };

  const sectorData = {
    LEFT: calcStats(allKicks.filter(k => ["SL-L", "5m-L", "15m-L"].includes(k.angle))),
    FRONT: calcStats(allKicks.filter(k => k.angle === "FR")),
    RIGHT: calcStats(allKicks.filter(k => ["15m-R", "5m-R", "SL-R"].includes(k.angle))),
  };

  const rangeData = distBands.reduce((acc, band) => {
    acc[band] = calcStats(allKicks.filter(k => k.distance === band));
    return acc;
  }, {} as any);

  const buckets: Record<string, Kick[]> = {};
  for (const k of allKicks) {
    const key = `${k.distance}|${k.angle}`;
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(k);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex p-1 bg-secondary/30 rounded-lg w-full max-w-[240px] border border-card-border/50">
          {['grid', 'sectors', 'range'].map((mode) => (
            <button
              key={mode}
              onClick={() => setView(mode as any)}
              className={`flex-1 py-1.5 rounded-md font-display text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${
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

      {view === 'grid' && (
        <div className="overflow-hidden rounded-xl border border-card-border bg-card animate-in fade-in zoom-in-95 duration-500">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-card-border bg-secondary/10">
                <th className="px-2 py-3 w-16 text-left font-display text-[8px] font-black tracking-widest text-muted-foreground uppercase italic">RANGE</th>
                {angleCols.map((col, i) => (
                  <th key={`${col.key}-${i}`} className="px-1 py-3 text-center font-display text-[10px] font-black tracking-widest text-foreground uppercase italic">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {distBands.map((band) => (
                <tr key={band} className="border-b border-card-border last:border-b-0 group">
                  <td className="px-2 py-3 font-display text-[10px] font-black text-muted-foreground/80 whitespace-nowrap bg-secondary/5 italic">{band}</td>
                  {angleCols.map((col, i) => {
                    const kicks = buckets[`${band}|${col.key}`];
                    const stats = calcStats(kicks || []);
                    const bg = getHeatColor(stats.pct);
                    const fg = getTextColor(stats.pct);
                    return (
                      <td key={`${col.key}-${i}`} className="px-0.5 py-1 text-center transition-all group-hover:bg-secondary/5">
                        <div 
                          className="mx-auto flex w-full flex-col items-center justify-center rounded-md py-2 border border-black/10 shadow-inner" 
                          style={{ backgroundColor: bg }}
                        >
                          {stats.pct !== null ? (
                            <>
                              <span className="font-display text-[11px] font-black leading-tight italic" style={{ color: fg }}>{stats.pct}%</span>
                              <span className="font-mono text-[9px] font-bold leading-tight opacity-60" style={{ color: fg }}>{stats.made}/{stats.total}</span>
                            </>
                          ) : (
                            <span className="font-display text-[11px] opacity-20" style={{ color: fg }}>—</span>
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
              className="flex flex-col items-center justify-center rounded-xl border border-card-border shadow-lg"
              style={{ backgroundColor: getHeatColor(stats.pct) }}
            >
              <span className="font-display text-[9px] font-black uppercase tracking-widest opacity-40 mb-1 italic" style={{ color: getTextColor(stats.pct) }}>{label}</span>
              <span className="font-display text-2xl font-black italic tracking-tighter leading-none" style={{ color: getTextColor(stats.pct) }}>{stats.pct ?? 0}%</span>
              <span className="mt-1 font-mono text-[10px] font-bold opacity-50" style={{ color: getTextColor(stats.pct) }}>{stats.made}/{stats.total}</span>
            </div>
          ))}
        </div>
      )}

      {view === 'range' && (
        <div className="grid grid-cols-1 gap-2 animate-in slide-in-from-bottom-2 duration-500">
          {Object.entries(rangeData).map(([label, stats]: [string, any]) => (
            <div 
              key={label} 
              className="flex items-center justify-between px-5 py-4 rounded-xl border border-card-border shadow-md"
              style={{ backgroundColor: getHeatColor(stats.pct) }}
            >
              <span className="font-display text-[10px] font-black uppercase tracking-widest italic" style={{ color: getTextColor(stats.pct) }}>{label}</span>
              <div className="flex items-center gap-6">
                <div className="text-right">
                    <p className="font-display text-2xl font-black italic tracking-tighter leading-none" style={{ color: getTextColor(stats.pct) }}>{stats.pct ?? 0}%</p>
                    <p className="font-mono text-[9px] font-bold opacity-50 uppercase tracking-tighter" style={{ color: getTextColor(stats.pct) }}>Success</p>
                </div>
                <div className="h-8 w-px bg-black/10" />
                <span className="font-mono text-[10px] font-bold opacity-60" style={{ color: getTextColor(stats.pct) }}>{stats.made}/{stats.total}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EfficiencyMatrix;