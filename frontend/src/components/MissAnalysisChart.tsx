import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { TrendingDown } from "lucide-react";
import { useMemo } from "react";

interface MissData {
  name: string;
  value: number;
}

interface MissAnalysisChartProps {
  data: MissData[];
  shortMisses?: number;
  totalMisses?: number;
}

// Constants
const COLOR_MAP: Record<string, string> = {
  "Pure": "hsl(190, 100%, 50%)",
  "Hook": "hsl(340, 85%, 55%)",
  "Push": "hsl(30, 100%, 60%)",
  "Unspecified": "hsl(220, 20%, 28%)"
};
const DEFAULT_COLOR = "hsl(220, 10%, 45%)";

const CHART_CONFIG = {
  innerRadius: 42,
  outerRadius: 58,
  paddingAngle: 4,
  cornerRadius: 6,
} as const;

const MissAnalysisChart = ({ data, shortMisses = 0, totalMisses = 0 }: MissAnalysisChartProps) => {
  // Memoize all calculations
  const chartMetrics = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    const chartTotal = data.reduce((acc, item) => acc + item.value, 0);
    const grandTotal = totalMisses > 0 ? totalMisses : chartTotal;
    
    if (chartTotal === 0) return null;
    
    const topMiss = [...data].sort((a, b) => b.value - a.value)[0];
    const topPercentage = grandTotal > 0 ? Math.round((topMiss.value / grandTotal) * 100) : 0;
    const shortPct = grandTotal > 0 ? Math.round((shortMisses / grandTotal) * 100) : 0;
    
    return { chartTotal, grandTotal, topMiss, topPercentage, shortPct };
  }, [data, totalMisses, shortMisses]);

  if (!chartMetrics) return null;

  const { grandTotal, topMiss, topPercentage, shortPct } = chartMetrics;

  return (
    <div 
      className="rounded-xl border border-card-border bg-card p-4 shadow-sm animate-in fade-in zoom-in-95 duration-500"
      role="img"
      aria-label={`Miss analysis chart showing ${topMiss.name} as the dominant miss type at ${topPercentage}%`}
    >
      
      {/* TOP SECTION: CHART & LEGEND */}
      <div className="flex items-center justify-between gap-4 h-[160px]">
        
        {/* DONUT CHART */}
        <div className="w-[120px] h-[120px] relative shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={CHART_CONFIG.innerRadius}
                outerRadius={CHART_CONFIG.outerRadius}
                paddingAngle={CHART_CONFIG.paddingAngle}
                dataKey="value"
                stroke="none"
                cornerRadius={CHART_CONFIG.cornerRadius}
                isAnimationActive={true}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLOR_MAP[entry.name] || DEFAULT_COLOR} 
                    className="outline-none" 
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          {/* CENTER TEXT HUB */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="font-display text-2xl font-black italic tracking-tighter leading-none text-foreground">
              {topPercentage}%
            </p>
            <p className="font-display text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1.5 text-center px-1">
              {topMiss.name}
            </p>
          </div>
        </div>

        {/* LEGEND LIST */}
        <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto max-h-full pr-1">
          {data.map((item) => {
            const percentage = grandTotal > 0 ? Math.round((item.value / grandTotal) * 100) : 0;
            const itemColor = COLOR_MAP[item.name] || DEFAULT_COLOR;
            
            return (
              <div 
                key={item.name} 
                className="flex items-center justify-between gap-2 rounded-lg bg-secondary/10 px-3 py-2 border border-card-border/20 transition-all hover:bg-secondary/20"
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-1.5 h-1.5 rounded-full shrink-0 shadow-sm" 
                    style={{ backgroundColor: itemColor }} 
                  />
                  <p className="font-display text-[9px] font-black uppercase italic tracking-widest text-foreground">
                    {item.name}
                  </p>
                </div>
                <div className="flex items-baseline gap-1">
                  <p className="font-mono text-xs font-bold text-foreground">{percentage}%</p>
                  <p className="font-mono text-[8px] text-muted-foreground/60 font-bold">({item.value})</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM SECTION: POWER DEFICIT */}
      {shortMisses > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-secondary/20 p-3 border border-card-border/30">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-1.5 border border-primary/20 shadow-inner">
              <TrendingDown className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <p className="font-display text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground leading-none mb-1">
                Power Deficit
              </p>
              <p className="font-mono text-[10px] text-foreground/80">
                <span className="text-primary font-black italic">{shortPct}%</span> of misses fell short
              </p>
            </div>
          </div>
          <div className="font-mono text-[9px] font-bold text-muted-foreground/60 bg-secondary/40 px-2.5 py-1 rounded-md border border-card-border/30">
            {shortMisses}/{grandTotal}
          </div>
        </div>
      )}
    </div>
  );
};

export default MissAnalysisChart;