import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info, Target, TrendingUp, Trophy } from "lucide-react";

const VelocityInfoModal = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1.5 transition-all hover:bg-secondary active:scale-95 border border-card-border/50">
          <Info className="h-3.5 w-3.5 text-primary" />
          <span className="font-display text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Graph Key
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[320px] rounded-2xl border-card-border bg-card p-6 shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="font-display text-xl font-black italic tracking-tighter uppercase text-foreground text-center">
            Velocity <span className="text-primary">Intelligence</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* ACCURACY SECTION */}
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-display text-[11px] font-black uppercase tracking-wider text-primary mb-1">
                Accuracy (Solid Line)
              </h4>
              <p className="font-body text-[11px] leading-relaxed text-muted-foreground">
                The direct result of each individual session. High peaks show peak performance; dips show technical adjustments might be needed.
              </p>
            </div>
          </div>

          {/* PERFORMANCE CURVE SECTION */}
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10 border border-green-500/20">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h4 className="font-display text-[11px] font-black uppercase tracking-wider text-green-500 mb-1">
                Performance Curve (Dashed)
              </h4>
              <p className="font-body text-[11px] leading-relaxed text-muted-foreground">
                The dashed green line. This averages your last 3 sessions to show your true trajectory. If this is bending up, your consistency is improving.
              </p>
            </div>
          </div>

          {/* GOLDEN BOOT SECTION */}
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <Trophy className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <h4 className="font-display text-[11px] font-black uppercase tracking-wider text-yellow-500 mb-1">
                Golden Boot
              </h4>
              <p className="font-body text-[11px] leading-relaxed text-muted-foreground">
                Your highest-rated Match performance. This is the "Gold Standard" of your current season based on accuracy and volume.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-card-border/50 pt-4 text-center">
          <p className="font-display text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 italic">
            Nudge Check • Performance Lab v1.0
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VelocityInfoModal;