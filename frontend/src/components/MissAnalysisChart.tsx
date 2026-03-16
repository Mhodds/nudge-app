import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const RUCK_COLORS = {
  Pure: '#00D4FF',
  Hook: '#E6337A',
  Push: '#F06422',
  Short: '#9CA3AF',
};

const MissAnalysisChart = ({ data }) => {
  const totalMisses = data.reduce((acc, curr) => acc + curr.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const percentage = totalMisses > 0 ? Math.round((value / totalMisses) * 100) : 0;
      return (
        <div className="bg-[#1C2436] border border-[#2A3548] p-2 rounded-lg shadow-xl">
          <p className="text-[#E6FCFF] text-[10px] font-black uppercase tracking-wider">
            {payload[0].name}: <span className="text-[#00D4FF]">{percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const sortedData = [...data].sort((a, b) => b.value - a.value);
  const topMiss = sortedData[0];
  const topPercentage = totalMisses > 0 ? Math.round((topMiss.value / totalMisses) * 100) : 0;

  return (
    <div className="bg-card border border-card-border p-4 rounded-[20px] shadow-sm w-full max-w-md mx-auto">
      {/* Tightened Header */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="text-foreground text-sm font-black tracking-tight uppercase italic">Miss DNA</h3>
        </div>
        <div className="bg-secondary/50 px-2 py-0.5 rounded-md border border-card-border">
          <span className="text-primary text-[10px] font-black">{totalMisses} TOTAL</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-2">
        {/* Shrunken Chart Container */}
        <div className="h-32 w-32 relative flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={48}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={RUCK_COLORS[entry.name as keyof typeof RUCK_COLORS]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Central Label - Adjusted for size */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-stat-value text-xl font-black leading-none">
              {topPercentage}%
            </span>
            <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-tighter">
              {topMiss?.name || '---'}
            </span>
          </div>
        </div>

        {/* Compact Legend - Switched to a vertical list next to the chart */}
        <div className="flex-grow grid grid-cols-1 gap-1.5">
          {data.map((item) => {
            const itemPercent = totalMisses > 0 ? Math.round((item.value / totalMisses) * 100) : 0;
            return (
              <div key={item.name} className="flex items-center justify-between bg-secondary/20 px-2 py-1.5 rounded-lg border border-card-border/30">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: RUCK_COLORS[item.name as keyof typeof RUCK_COLORS] }} />
                  <p className="text-muted-foreground text-[10px] font-bold uppercase">{item.name}</p>
                </div>
                <p className="text-foreground text-[10px] font-black">{itemPercent}%</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MissAnalysisChart;