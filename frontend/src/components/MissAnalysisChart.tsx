import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { TrendingDown } from "lucide-react";

interface MissAnalysisChartProps {
  data: {
    name: string;
    value: number;
  }[];
  shortMisses?: number;
  totalMisses?: number;
}

const COLOR_MAP: Record<string, string> = {
  "Pure": "hsl(190, 100%, 50%)",
  "Hook": "hsl(330, 85%, 55%)",
  "Push": "hsl(30, 100%, 60%)",
  "Unspecified": "#4b5563"
};
const DEFAULT_COLOR = "#a855f7";

const MissAnalysisChart = ({ data, shortMisses = 0, totalMisses = 0 }: MissAnalysisChartProps) => {
  if (!data || data.length === 0) return null;

  const chartTotal = data.reduce((acc, item) => acc + item.value, 0);
  const grandTotal = totalMisses > 0 ? totalMisses : chartTotal;

  if (chartTotal === 0) return null;

  const topMiss = [...data].sort((a, b) => b.value - a.value)[0];
  const topPercentage = grandTotal > 0 ? Math.round((topMiss.value / grandTotal) * 100) : 0;
  const shortPct = grandTotal > 0 ? Math.round((shortMisses / grandTotal) * 100) : 0;

  return (
    <div className="rounded-xl border border-card-border bg-card p-4">
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
                innerRadius={42}
                outerRadius={58}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
                cornerRadius={4}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLOR_MAP[entry.name] || DEFAULT_COLOR} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="font-display text-xl font-black italic leading-none text-foreground">{topPercentage}%</p>
            <p className="font-display text-[8px] font-black uppercase tracking-wider text-muted-foreground mt-1 text-center px-1">
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
              <div key={item.name} className="flex items-center justify-between gap-2 rounded-lg bg-secondary/10 px-3 py-1.5 border border-card-border/20">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: itemColor }} />
                  <p className="font-display text-[9px] font-black uppercase italic tracking-wider text-foreground">
                    {item.name}
                  </p>
                </div>
                <div className="flex items-baseline gap-1">
                  <p className="font-mono text-xs font-bold text-foreground">{percentage}%</p>
                  <p className="font-mono text-[8px] text-muted-foreground">({item.value})</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM SECTION: POWER DEFICIT (Tucked inside the card) */}
      {shortMisses > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-secondary/20 p-2.5 border-t border-card-border/30">
          <div className="flex items-center gap-2.5">
            <div className="rounded bg-primary/10 p-1">
              <TrendingDown className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <p className="font-display text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground leading-none">
                Power Deficit
              </p>
              <p className="font-mono text-[10px] text-foreground mt-1">
                <strong className="text-primary">{shortPct}%</strong> of misses fell short
              </p>
            </div>
          </div>
          <div className="font-mono text-[10px] font-bold text-muted-foreground bg-secondary/30 px-2 py-0.5 rounded border border-card-border/30">
            {shortMisses}/{grandTotal}
          </div>
        </div>
      )}
    </div>
  );
};

export default MissAnalysisChart;