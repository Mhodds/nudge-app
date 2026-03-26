import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  Label,
} from "recharts";
import { Trophy } from "lucide-react";
import { usePerfectShiftId } from "@/hooks/useSessions";

const VelocityGraph = ({ sessions = [] }: { sessions: any[] }) => {
  const { data: perfectId } = usePerfectShiftId();

  // FIXED: Corrected the sort logic to Oldest -> Newest (Left -> Right)
  const displaySessions = [...sessions].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  if (displaySessions.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-card-border bg-card py-10">
        <svg className="mb-3 h-8 w-8 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <p className="px-6 text-center font-display text-[10px] font-black italic tracking-widest text-muted-foreground uppercase">
          Velocity building after 2 sessions
        </p>
      </div>
    );
  }

  const ROLLING_WINDOW = 3;

  const dataBase = displaySessions.map((m, i) => {
    const ts = new Date(m.timestamp);
    const placeKicks = m.kicks.filter((k: any) => k.kickType !== "try" && k.kickType !== "drop_goal");
    const acc = placeKicks.length > 0
      ? Math.round(placeKicks.filter((k: any) => k.result === "made").length / placeKicks.length * 100)
      : 0;
    return {
      id: m.id,
      label: `S${i + 1}`,
      date: ts.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }).toUpperCase(),
      accuracy: acc,
      teamName: m.teamName,
    };
  });

  const data = dataBase.map((d, i) => {
    const windowStart = Math.max(0, i - ROLLING_WINDOW + 1);
    const w = dataBase.slice(windowStart, i + 1);
    return { ...d, rollingAvg: Math.round(w.reduce((s, x) => s + x.accuracy, 0) / w.length) };
  });

  const allKicks = displaySessions.flatMap(m => m.kicks).filter((k: any) => k.kickType !== "try" && k.kickType !== "drop_goal");
  const seasonMean = allKicks.length > 0
    ? Math.round(allKicks.filter((k: any) => k.result === "made").length / allKicks.length * 100)
    : 0;

  const CustomDot = (props: any) => {
    const { cx, cy, payload, index } = props;
    if (cx == null || cy == null) return null;

    const isLast = index === data.length - 1;
    const isPerfect = payload.id === perfectId;

    return (
      <g>
        {isPerfect && (
          <g>
            <circle cx={cx} cy={cy - 22} r={10} fill="rgba(234, 179, 8, 0.15)" />
            <foreignObject x={cx - 8} y={cy - 30} width={16} height={16}>
              <Trophy className="h-4 w-4 text-yellow-500 fill-yellow-500/20" />
            </foreignObject>
          </g>
        )}

        {isLast ? (
          <g>
            <circle cx={cx} cy={cy} r={8} fill="hsl(190 100% 50% / 0.25)" className="animate-pulse" />
            <circle cx={cx} cy={cy} r={4} fill="hsl(190, 100%, 50%)" stroke="hsl(220, 25%, 10%)" strokeWidth={2} />
          </g>
        ) : (
          <circle 
            cx={cx} 
            cy={cy} 
            r={isPerfect ? 4 : 3} 
            fill={isPerfect ? "#EAB308" : "hsl(190, 100%, 50%)"} 
          />
        )}
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    const isPerfect = d.id === perfectId;

    return (
      <div className="rounded-lg border border-card-border bg-card px-3 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <p className="font-display text-xs font-bold text-primary">{d.accuracy}%</p>
          {isPerfect && <Trophy className="h-3 w-3 text-yellow-500" />}
        </div>
        <p className="font-mono text-[9px] text-muted-foreground uppercase">
          {d.date} {d.teamName ? `• VS ${d.teamName}` : ""}
        </p>
        {isPerfect && (
          <p className="mt-1 font-display text-[8px] font-black uppercase text-yellow-500 tracking-widest italic leading-tight">
            Golden Boot Performance
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-card-border bg-card p-4">
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 35, right: 60, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="velocityGlow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(190, 100%, 50%)" stopOpacity={0.6} />
              <stop offset="100%" stopColor="hsl(190, 100%, 50%)" stopOpacity={1} />
            </linearGradient>
            {/* UPDATED: Performance Curve gradient is now High-Performance Green */}
            <linearGradient id="rollingGlow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(142, 72%, 50%)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(142, 72%, 50%)" stopOpacity={0.8} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" hide={true} />
          <YAxis 
            domain={[0, 100]} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 10, fontWeight: 'bold' }} 
            tickFormatter={(v: number) => `${v}%`} 
          />
          
          <ReferenceLine 
            y={seasonMean} 
            stroke="hsl(215, 25%, 40%)" 
            strokeDasharray="4 4" 
            strokeOpacity={0.6}
          >
            <Label 
              value={`AVG ${seasonMean}%`} 
              position="right" 
              fill="hsl(215, 25%, 45%)" 
              fontSize={10} 
              fontWeight="900"
              className="font-display italic"
              dx={10}
            />
          </ReferenceLine>

          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Line type="monotone" dataKey="rollingAvg" stroke="url(#rollingGlow)" strokeWidth={1.5} strokeDasharray="6 3" dot={false} activeDot={false} isAnimationActive={true} />
          <Line type="monotone" dataKey="accuracy" stroke="url(#velocityGlow)" strokeWidth={2.5} dot={<CustomDot />} activeDot={{ r: 5, fill: "hsl(190, 100%, 50%)" }} isAnimationActive={true} />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-card-border/50 pt-3">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded-full bg-primary" />
          <span className="font-display text-[9px] font-black tracking-widest text-muted-foreground uppercase">Accuracy</span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* UPDATED: Legend indicator changed to Green */}
          <span className="inline-block h-0.5 w-4 rounded-full border-t border-dashed" style={{ borderColor: "hsl(142, 72%, 50%)" }} />
          <span className="font-display text-[9px] font-black tracking-widest text-muted-foreground uppercase">Performance Curve</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Trophy className="h-3 w-3 text-yellow-500 fill-yellow-500/20" />
          <span className="font-display text-[9px] font-black tracking-widest text-yellow-500 uppercase">Golden Boot</span>
        </div>
      </div>
    </div>
  );
};

export default VelocityGraph;