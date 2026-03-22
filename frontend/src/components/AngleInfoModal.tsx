import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";

const AngleInfoModal = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-full bg-secondary/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground">
          <Info className="h-3.5 w-3.5" />
          Zone Map
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md rounded-2xl border-card-border bg-card p-5 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-black italic tracking-tighter uppercase text-primary">
            Nudge <span className="text-foreground">Zones</span>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          {/* THE COMPACT PROPORTIONAL FIELD */}
          <div className="relative aspect-[3.5/1] w-full overflow-hidden rounded-lg border border-card-border bg-background/50">
            
            {/* GRID LANES */}
            <div 
              className="grid h-full w-full opacity-30"
              style={{ gridTemplateColumns: "10% 14% 20% 12% 20% 14% 10%" }}
            >
              <div className="bg-red-500/40 border-r border-white/5" />
              <div className="bg-orange-500/40 border-r border-white/5" />
              <div className="bg-blue-500/40 border-r border-white/10" />
              <div className="bg-green-500/60" />
              <div className="bg-blue-500/40 border-l border-white/10" />
              <div className="bg-orange-500/40 border-l border-white/5" />
              <div className="bg-red-500/40 border-l border-white/5" />
            </div>

            {/* TRY LINE & POSTS */}
            <div className="absolute inset-x-0 top-0">
              <div className="h-[2px] w-full bg-white/20" />
              <div 
                className="grid w-full"
                style={{ gridTemplateColumns: "10% 14% 20% 12% 20% 14% 10%" }}
              >
                <div className="col-start-4 flex justify-between h-6">
                  <div className="h-full w-[3px] bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)] rounded-b-full" /> 
                  <div className="h-full w-[3px] bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)] rounded-b-full" />
                </div>
              </div>
            </div>

            {/* ENHANCED LABELS - LARGER FONT + WIDER SPACING */}
            <div 
              className="absolute inset-x-0 bottom-2 grid text-center font-display text-[11px] font-black tracking-[0.15em] text-foreground uppercase"
              style={{ gridTemplateColumns: "10% 14% 20% 12% 20% 14% 10%" }}
            >
              <div className="text-white/90">SL</div>
              <div className="text-white/90">5M</div>
              <div className="text-white/90">15M</div>
              <div className="text-green-400 drop-shadow-md">FR</div>
              <div className="text-white/90">15M</div>
              <div className="text-white/90">5M</div>
              <div className="text-white/90">SL</div>
            </div>
          </div>

          {/* COMPACT LEGEND */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="space-y-0.5 border-l-2 border-green-500 pl-2">
              <p className="font-display text-[10px] font-black uppercase tracking-widest text-green-500">FR (Front)</p>
              <p className="font-body text-[11px] leading-tight text-muted-foreground font-medium">Inside the uprights.</p>
            </div>
            <div className="space-y-0.5 border-l-2 border-blue-500 pl-2">
              <p className="font-display text-[10px] font-black uppercase tracking-widest text-blue-500">15m Zone</p>
              <p className="font-body text-[11px] leading-tight text-muted-foreground font-medium">Upright to 15m line.</p>
            </div>
            <div className="space-y-0.5 border-l-2 border-orange-500 pl-2">
              <p className="font-display text-[10px] font-black uppercase tracking-widest text-orange-400">5m Zone</p>
              <p className="font-body text-[11px] leading-tight text-muted-foreground font-medium">15m line to 5m line.</p>
            </div>
            <div className="space-y-0.5 border-l-2 border-red-500 pl-2">
              <p className="font-display text-[10px] font-black uppercase tracking-widest text-red-500">SL (Sideline)</p>
              <p className="font-body text-[11px] leading-tight text-muted-foreground font-medium">5m line to sideline.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AngleInfoModal;