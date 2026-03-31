import {
  ArrowUpLeft, ArrowUp, ArrowUpRight,
  ArrowLeft, ArrowRight,
  ArrowDownLeft, ArrowDown, ArrowDownRight,
} from "lucide-react";

interface WindDialProps {
  intensity: string;
  angle: string;
  onChange: (updates: { windIntensity?: string; windAngle?: string }) => void;
  activeColorClass?: string;
}

const windGrid = [
  { label: "TAIL-L", icon: ArrowUpLeft, key: "TAIL-L" }, { label: "TAIL", icon: ArrowUp, key: "TAIL" }, { label: "TAIL-R", icon: ArrowUpRight, key: "TAIL-R" },
  { label: "LEFT", icon: ArrowLeft, key: "LEFT" }, null, { label: "RIGHT", icon: ArrowRight, key: "RIGHT" },
  { label: "HEAD-L", icon: ArrowDownLeft, key: "HEAD-L" }, { label: "HEAD", icon: ArrowDown, key: "HEAD" }, { label: "HEAD-R", icon: ArrowDownRight, key: "HEAD-R" }
];

const levels = ["still", "low", "med", "high"];

export default function WindDial({ 
  intensity, 
  angle, 
  onChange, 
  activeColorClass = "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
}: WindDialProps) {
  const isStill = intensity === "still";

  return (
    <div className="space-y-3">
      <h3 className="font-display text-xs font-black tracking-widest text-foreground uppercase italic">WIND</h3>
      
      {/* 3x3 Grid */}
      <div className={`grid grid-cols-3 gap-1 transition-all duration-300 ${isStill ? "opacity-20 pointer-events-none" : "opacity-100"}`}>
        {windGrid.map((item, idx) => (
          item ? (
            <button
              key={item.key}
              onClick={() => onChange({ windAngle: item.key })}
              className={`flex flex-col items-center justify-center rounded-lg py-2 transition-all ${
                angle === item.key 
                  ? activeColorClass 
                  : "bg-secondary text-muted-foreground/50"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span className="text-[8px] font-black mt-1 uppercase">{item.label}</span>
            </button>
          ) : (
            <div key={`spacer-${idx}`} />
          )
        ))}
      </div>

      {/* Intensity Row */}
      <div className="flex rounded-lg bg-secondary p-1">
        {levels.map((level) => (
          <button
            key={level}
            onClick={() => onChange({ 
              windIntensity: level, 
              windAngle: level === "still" ? "" : angle 
            })}
            className={`flex-1 rounded-md py-1.5 font-display text-[9px] font-black uppercase tracking-widest transition-all ${
              intensity === level 
                ? "bg-foreground text-background shadow-sm" 
                : "text-muted-foreground hover:bg-background/10"
            }`}
          >
            {level}
          </button>
        ))}
      </div>
    </div>
  );
}