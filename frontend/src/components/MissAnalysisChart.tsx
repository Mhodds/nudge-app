import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface MissAnalysisChartProps {
  data: {
    name: string;
    value: number;
  }[];
}

const COLORS = ["hsl(190, 100%, 50%)", "hsl(330, 85%, 55%)", "hsl(30, 100%, 60%)", "#a855f7"];

const MissAnalysisChart = ({ data }: MissAnalysisChartProps) => {
  if (data.length === 0) return null;

  const total = data.reduce((acc, item) => acc + item.value, 0);

  // Find the top miss type for the center display
  const topMiss = [...data].sort((a, b) => b.value - a.value)[0];
  const topPercentage = total > 0 ? Math.round((topMiss.value / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-card-border bg-card p-4 h-[180px]">
      <div className="flex items-center justify-between gap-4 h-full">
        {/* DONUT CHART */}
        <div className="w-[120px] h-[120px] relative">
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
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-display text-xl font-black italic leading-none text-foreground">{topPercentage}%</p>
            <p className="font-display text-[8px] font-black uppercase tracking-wider text-muted-foreground mt-1">{topMiss.name}</p>
          </div>
        </div>

        {/* LEGEND LIST */}
        <div className="flex-1 flex flex-col gap-2">
          {data.map((item, index) => {
            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={item.name} className="flex items-center justify-between gap-2 rounded-lg bg-secondary/10 px-3 py-2 border border-card-border/30">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <p className="font-display text-[10px] font-black uppercase italic tracking-[0.1em] text-foreground">
                    {item.name}
                  </p>
                </div>
                <div className="flex items-baseline gap-1">
                  <p className="font-mono text-sm font-bold text-foreground">{percentage}%</p>
                  <p className="font-mono text-[9px] text-muted-foreground">({item.value})</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MissAnalysisChart;