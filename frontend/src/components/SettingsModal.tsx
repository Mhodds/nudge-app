import { useState, useEffect } from "react";
import { Brain, Save, X, Tag } from "lucide-react";
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
  const { profile, updateMantra, updateTagLibrary } = useProfile();
  const [mantraDraft, setMantraDraft] = useState("");
  const [tagLibrary, setTagLibrary] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (isOpen) {
      setMantraDraft(profile?.mantra ?? "");
      setTagLibrary(profile?.tag_library ?? []);
      setTagInput("");
    }
  }, [isOpen, profile?.mantra, profile?.tag_library]);

  const addTag = async () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (!trimmed || tagLibrary.includes(trimmed)) { setTagInput(""); return; }
    const newLibrary = [...tagLibrary, trimmed];
    setTagLibrary(newLibrary);
    setTagInput("");
    await updateTagLibrary.mutateAsync(newLibrary);
  };

  const removeTag = async (tag: string) => {
    const newLibrary = tagLibrary.filter(t => t !== tag);
    setTagLibrary(newLibrary);
    await updateTagLibrary.mutateAsync(newLibrary);
  };

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

            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="rounded-full bg-primary/10 p-1.5">
                  <Tag className="h-3.5 w-3.5 text-primary" />
                </div>
                <label className="font-display text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">
                  Tag Library
                </label>
              </div>

              {tagLibrary.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {tagLibrary.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 px-2.5 py-1 font-display text-[9px] font-bold text-primary uppercase tracking-wider">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors ml-0.5">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {tagLibrary.length === 0 && (
                <p className="mb-3 text-[10px] text-muted-foreground/50 italic">No tags yet. Add your first below.</p>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addTag()}
                  placeholder="New tag..."
                  className="flex-1 rounded-xl border border-card-border bg-secondary px-3 py-2 font-display text-[10px] font-bold tracking-wider text-foreground placeholder:text-muted-foreground/30 focus:border-primary focus:outline-none uppercase"
                />
                <button
                  onClick={addTag}
                  disabled={!tagInput.trim()}
                  className="rounded-xl border border-card-border bg-card px-3 py-2 font-display text-[10px] font-bold tracking-wider text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors uppercase disabled:opacity-40"
                >
                  ADD
                </button>
              </div>
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