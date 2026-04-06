import { Dispatch, SetStateAction, useState } from "react";
import { X } from "lucide-react";
import { Kick } from "@/types/session";
import WindDial from "@/components/WindDial";

const distanceBands = ["0-22m", "22-30m", "30-40m", "40+m"];
const anglePositions = [
  { key: "SL-L", label: "SL" },
  { key: "5m-L", label: "5m" },
  { key: "15m-L", label: "15m" },
  { key: "FR", label: "FR" },
  { key: "15m-R", label: "15m" },
  { key: "5m-R", label: "5m" },
  { key: "SL-R", label: "SL" },
];
const missOptions = ["Pure", "Hook", "Push"];
const feelOptions = [1, 2, 3, 4, 5];

interface KickEditorFieldsProps {
  draft: Partial<Kick>;
  setDraft: Dispatch<SetStateAction<Partial<Kick>>>;
  tagLibrary?: string[];
  onCreateTag?: (tag: string) => void;
}

export default function KickEditorFields({ draft, setDraft, tagLibrary = [], onCreateTag }: KickEditorFieldsProps) {
  const [tagInput, setTagInput] = useState("");
  const windValue = draft.wind || "STILL";
  const isStill = windValue === "STILL";
  const [currentIntensity, currentAngle] = isStill ? ["still", ""] : windValue.split("-");

  const handleWindChange = (updates: { windIntensity?: string; windAngle?: string }) => {
    const newIntensity = updates.windIntensity !== undefined ? updates.windIntensity : currentIntensity;
    const newAngle = updates.windAngle !== undefined ? updates.windAngle : currentAngle;
    if (newIntensity === "still") {
      setDraft(prev => ({ ...prev, wind: "STILL" }));
    } else {
      setDraft(prev => ({ ...prev, wind: `${newIntensity}-${newAngle}` }));
    }
  };

  const currentMiss = draft.technicalMiss || "";
  const isShort = currentMiss.toLowerCase().includes("short");
  const baseMiss = missOptions.find(m => currentMiss.toLowerCase().includes(m.toLowerCase())) || "";

  const toggleBaseMiss = (b: string) => {
    const newBase = baseMiss === b ? "" : b;
    setDraft(prev => ({ ...prev, technicalMiss: [newBase, isShort ? "Short" : ""].filter(Boolean).join(" + ") }));
  };

  const toggleShort = () => {
    setDraft(prev => ({ ...prev, technicalMiss: [baseMiss, !isShort ? "Short" : ""].filter(Boolean).join(" + ") }));
  };

  return (
    <div className="flex flex-col gap-2 mt-2">
      {/* RESULT */}
      <div className="flex rounded-lg bg-secondary p-1">
        {(["made", "miss"] as const).map((r) => (
          <button key={r} onClick={() => setDraft((d) => ({ ...d, result: r, technicalMiss: r === "made" ? undefined : d.technicalMiss }))}
            className={`flex-1 rounded-md py-1.5 font-display text-[11px] font-bold tracking-wider transition-colors ${
              draft.result === r ? (r === "made" ? "bg-success text-accent-foreground" : "bg-training text-accent-foreground") : "text-muted-foreground"
            }`}
          >{r.toUpperCase()}</button>
        ))}
      </div>

      {/* TECHNICAL MISS */}
      {draft.result === "miss" && (
        <div className="flex gap-1 rounded-lg bg-secondary p-1">
          {missOptions.map(m => (
            <button key={m} onClick={() => toggleBaseMiss(m)}
              className={`flex-1 rounded-md py-1 font-display text-[10px] font-bold uppercase transition-colors ${
                baseMiss === m ? "bg-training/20 text-training border border-training/30" : "text-muted-foreground"
              }`}
            >{m}</button>
          ))}
          <div className="w-px bg-card-border mx-1" />
          <button onClick={toggleShort}
            className={`flex-1 rounded-md py-1 font-display text-[10px] font-bold uppercase transition-colors ${
              isShort ? "bg-training text-background" : "text-muted-foreground"
            }`}
          >SHORT</button>
        </div>
      )}

      {/* DISTANCE & ANGLE (hidden for try / drop_goal) */}
      {draft.kickType !== "try" && draft.kickType !== "drop_goal" && (
        <>
          <div className="flex rounded-lg bg-secondary p-1">
            {distanceBands.map((opt) => (
              <button key={opt} onClick={() => setDraft((d) => ({ ...d, distance: opt }))}
                className={`flex-1 rounded-md py-1.5 font-display text-[11px] font-bold tracking-wider transition-colors ${
                  draft.distance === opt ? "bg-foreground text-background" : "text-muted-foreground"
                }`}
              >{opt}</button>
            ))}
          </div>
          <div className="flex rounded-lg bg-secondary p-1">
            {anglePositions.map((opt) => (
              <button key={opt.key} onClick={() => setDraft((d) => ({ ...d, angle: opt.key }))}
                className={`flex-1 rounded-md py-1.5 font-display text-[11px] font-bold tracking-wider transition-colors ${
                  draft.angle === opt.key ? "bg-foreground text-background" : "text-muted-foreground"
                }`}
              >{opt.label}</button>
            ))}
          </div>
        </>
      )}

      {/* WIND */}
      <div className="rounded-lg bg-secondary p-2">
        <WindDial
          intensity={currentIntensity}
          angle={currentAngle}
          onChange={handleWindChange}
          activeColorClass="bg-primary text-primary-foreground shadow-sm"
        />
      </div>

      {/* TAGS */}
      {(() => {
        const appliedTags = draft.tags || [];
        const suggestions = tagLibrary.filter(t => !appliedTags.includes(t));

        const applyTag = (tag: string) => {
          setDraft(d => ({ ...d, tags: [...(d.tags || []), tag] }));
        };
        const removeTag = (tag: string) => {
          setDraft(d => ({ ...d, tags: (d.tags || []).filter(t => t !== tag) }));
        };
        const handleCreate = () => {
          const trimmed = tagInput.trim();
          if (!trimmed) return;
          if (!appliedTags.includes(trimmed)) {
            setDraft(d => ({ ...d, tags: [...(d.tags || []), trimmed] }));
          }
          onCreateTag?.(trimmed);
          setTagInput("");
        };

        return (
          <div className="rounded-lg bg-secondary p-2 flex flex-col gap-2">
            <span className="font-display text-[9px] font-bold text-muted-foreground tracking-widest uppercase">TAGS</span>

            {/* Applied tags */}
            {appliedTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {appliedTags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 font-display text-[9px] font-bold text-primary uppercase tracking-wider">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors"><X className="h-2.5 w-2.5" /></button>
                  </span>
                ))}
              </div>
            )}

            {/* Library suggestions */}
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {suggestions.map(tag => (
                  <button key={tag} onClick={() => applyTag(tag)}
                    className="rounded-full border border-card-border bg-card px-2 py-0.5 font-display text-[9px] font-bold text-muted-foreground uppercase tracking-wider hover:border-primary/40 hover:text-primary transition-colors">
                    + {tag}
                  </button>
                ))}
              </div>
            )}

            {/* Create new tag */}
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
                placeholder="New tag..."
                className="flex-1 rounded-md bg-card border border-card-border px-2 py-1 font-display text-[9px] font-bold text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 uppercase tracking-wider"
              />
              <button onClick={handleCreate}
                className="rounded-md bg-card border border-card-border px-2 py-1 font-display text-[9px] font-bold text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors uppercase tracking-wider">
                ADD
              </button>
            </div>
          </div>
        );
      })()}

      {/* FEEL */}
      <div className="flex rounded-lg bg-secondary p-1">
        <div className="flex items-center px-3 font-display text-[9px] font-bold text-muted-foreground tracking-widest">FEEL</div>
        {feelOptions.map((f) => (
          <button key={f} onClick={() => setDraft((d) => ({ ...d, feel: d.feel === f ? undefined : f }))}
            className={`flex-1 rounded-md py-1.5 font-display text-[11px] font-bold transition-colors ${
              draft.feel === f ? "bg-pink-500 text-white" : "text-muted-foreground hover:bg-card"
            }`}
          >{f}</button>
        ))}
      </div>

    </div>
  );
}
