import { Settings } from "lucide-react";
import { useInterfaceMode } from "@/context/InterfaceModeContext";

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
        <button
          onClick={() => setMode("basic")}
          className={`flex-1 rounded-md py-2 font-display text-sm font-bold tracking-wider transition-colors ${
            mode === "basic"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground"
          }`}
        >
          BASIC
        </button>
        <button
          onClick={() => setMode("detailed")}
          className={`flex-1 rounded-md py-2 font-display text-sm font-bold tracking-wider transition-colors ${
            mode === "detailed"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground"
          }`}
        >
          DETAILED
        </button>
      </div>
    </div>
  );
};

export default InterfaceMode;
