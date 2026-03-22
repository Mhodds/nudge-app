import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info, Zap } from "lucide-react";

const VelocityInfoModal = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-full bg-secondary/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground">
          <Info className="h-3.5 w-3.5" />
          Graph Key
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md rounded-2xl border-card-border bg-card p-5 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-black italic tracking-tighter uppercase text-primary">
            Velocity <span className="text-foreground">Metrics</span>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-5">
          {/* MOMENTUM BOX */}
          <div className="flex h-16 w-full items-center justify-center rounded-lg border border-card-border bg-background/50 px-4">
            <div className="flex items-center gap-4">
              <Zap className="h-6 w-6 text-primary" />
              <p className="text-[10px] font-medium leading-tight text-muted-foreground">
                <span className="font-black text-foreground uppercase tracking-widest">Momentum Check:</span><br />
                The Graph shows how your recent performance compares to your previous trends.
              </p>
            </div>
          </div>

          {/* DEFINITIONS */}
          <div className="space-y-4">
            <div className="space-y-1 border-l-2 border-primary pl-3">
              <p className="font-display text-[10px] font-black uppercase tracking-widest text-primary">Accuracy (Blue Line)</p>
              <p className="font-body text-[11px] leading-tight text-muted-foreground font-medium">
                Your raw success rate for each individual session. This is your "Right Now" performance.
              </p>
            </div>

            <div className="space-y-1 border-l-2 border-[#f59e0b] pl-3">
              <p className="font-display text-[10px] font-black uppercase tracking-widest text-[#f59e0b]">Rolling 3 (Dashed Line)</p>
              <p className="font-body text-[11px] leading-tight text-muted-foreground font-medium">
                The moving average of your 3 most recent sessions. This smooths out "lucky" or "bad" days to show your true baseline.
              </p>
            </div>

            <div className="space-y-1 border-l-2 border-green-500 pl-3">
              <p className="font-display text-[10px] font-black uppercase tracking-widest text-green-500">Form (The Badge)</p>
              <p className="font-body text-[11px] leading-tight text-muted-foreground font-medium">
                Your immediate momentum. Compares your current 3-session block against your previous 3-session block.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VelocityInfoModal;