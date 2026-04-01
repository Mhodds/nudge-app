import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";

const ZONE_COLUMNS = "10% 14% 20% 12% 20% 14% 10%";

const NudgeZonesModal = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-full bg-secondary/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground">
          <Info className="h-3.5 w-3.5" />
          Zone Map
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md rounded-3xl border-card-border bg-card p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-black italic tracking-tighter uppercase text-foreground">
            Nudge <span className="text-primary">Zones</span>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* THE BRIGHTENED PROPORTIONAL FIELD */}
          <div className="relative aspect-[3.5/1] w-full overflow-hidden rounded-xl border border-card-border shadow-lg">
            
            {/* VIBRANT GRID LANES */}
            <div 
              className="grid h-full w-full"
              style={{ gridTemplateColumns: ZONE_COLUMNS }}
            >
              <div className="bg-red-500/90 border-r border-black/10" />
              <div className="bg-orange-500/90 border-r border-black/10" />
              <div className="bg-blue-500/90 border-r border-black/10" />
              <div className="bg-green-500/90" />
              <div className="bg-blue-500/90 border-l border-black/10" />
              <div className="bg-orange-500/90 border-l border-black/10" />
              <div className="bg-red-500/90 border-l border-black/10" />
            </div>

            {/* TRY LINE & POSTS (CYAN GLOW) */}
            <div className="absolute inset-x-0 top-0">
              <div className="h-[3px] w-full bg-white/30" />
              <div 
                className="grid w-full"
                style={{ gridTemplateColumns: ZONE_COLUMNS }}
              >
                <div className="col-start-4 flex justify-between h-8">
                  <div className="h-full w-[3px] bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] rounded-b-sm" /> 
                  <div className="h-full w-[3px] bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] rounded-b-sm" />
                </div>
              </div>
            </div>

            {/* HIGH-CONTRAST LABELS */}
            <div 
              className="absolute inset-x-0 bottom-2.5 grid text-center font-display text-[11px] font-black tracking-[0.1em] text-white uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]"
              style={{ gridTemplateColumns: ZONE_COLUMNS }}
            >
              <div>SL</div>
              <div>5M</div>
              <div>15M</div>
              <div className="text-white">FR</div>
              <div>15M</div>
              <div>5M</div>
              <div>SL</div>
            </div>
          </div>

          {/* VIBRANT LEGEND */}
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <div className="space-y-1 border-l-[3px] border-green-500 pl-3">
              <p className="font-display text-[11px] font-black uppercase tracking-wider text-green-500">FR (Front)</p>
              <p className="font-body text-[11px] leading-tight text-muted-foreground font-semibold">Inside the uprights.</p>
            </div>
            <div className="space-y-1 border-l-[3px] border-blue-500 pl-3">
              <p className="font-display text-[11px] font-black uppercase tracking-wider text-blue-500">15m Zone</p>
              <p className="font-body text-[11px] leading-tight text-muted-foreground font-semibold">Upright to 15m line.</p>
            </div>
            <div className="space-y-1 border-l-[3px] border-orange-500 pl-3">
              <p className="font-display text-[11px] font-black uppercase tracking-wider text-orange-500">5m Zone</p>
              <p className="font-body text-[11px] leading-tight text-muted-foreground font-semibold">15m line to 5m line.</p>
            </div>
            <div className="space-y-1 border-l-[3px] border-red-500 pl-3">
              <p className="font-display text-[11px] font-black uppercase tracking-wider text-red-500">SL (Sideline)</p>
              <p className="font-body text-[11px] leading-tight text-muted-foreground font-semibold">5m line to sideline.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NudgeZonesModal;