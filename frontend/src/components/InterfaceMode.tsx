import { Settings } from "lucide-react";
import { useInterfaceMode } from "@/context/InterfaceModeContext";

const modes = ["basic", "detailed"] as const;

const InterfaceMode = () => {
  const { mode, setMode } = useInterfaceMode();

  return (
    <div className="mx-4 rounded-xl border border-card-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Settings className="h-5 w-5 text-muted-foreground" />
        <span className="font-display text-sm font-bold tracking-wider text-foreground">
          INTERFACE MODE
        </span>
      </div>
      <div className="flex rounded-lg bg-secondary p-1">
        {modes.map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-md py-2 font-display text-sm font-bold tracking-wider transition-colors ${
              mode === m
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            {m.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
};

export default InterfaceMode;