import { useState, useEffect } from "react";
import { Brain, Save } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const { profile, updateMantra } = useProfile();
  const [mantraDraft, setMantraDraft] = useState("");

  // Sync local state when profile loads or modal reopens
  useEffect(() => {
    if (isOpen) {
      setMantraDraft(profile?.mantra ?? "");
    }
  }, [isOpen, profile?.mantra]);

  const handleSave = async () => {
    try {
      await updateMantra.mutateAsync(mantraDraft);
      onClose();
    } catch {
      // mutation error is surfaced via updateMantra.isError if needed
    }
  };

  const isDirty = mantraDraft !== (profile?.mantra ?? "");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-card-border bg-card p-0 overflow-hidden shadow-2xl">
        <div className="p-6">
          <DialogHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle className="font-display text-xl font-black italic tracking-wider text-foreground">
                MENTAL PILLARS
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <label className="mb-2 block font-display text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">
                Active Training Mantra
              </label>
              <textarea
                value={mantraDraft}
                onChange={(e) => setMantraDraft(e.target.value)}
                placeholder="e.g., Tall chest, through the ball..."
                className="w-full min-h-[120px] rounded-xl border border-card-border bg-secondary p-4 font-display text-sm font-bold tracking-wider text-foreground placeholder:text-muted-foreground/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
              />
              <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground italic opacity-70">
                This pillar will be enforced via a 10-second "Circuit Breaker" if you log two consecutive misses in a Technical Drill.
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={updateMantra.isPending || !isDirty}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-display text-sm font-black tracking-widest text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Save className="h-4 w-4 transition-transform group-hover:scale-110" />
              {updateMantra.isPending ? "SAVING..." : "COMMIT TO MEMORY"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;