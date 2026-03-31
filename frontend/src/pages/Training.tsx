import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { buildSession } from "@/lib/sessions";
import { useSaveSession } from "@/hooks/useSessions";
import { useProfile } from "@/hooks/useProfile"; 
import { Kick } from "@/types/session";
import SubmitOverlay from "@/components/SubmitOverlay";
import {
  CheckCircle, Circle, Trash2, StickyNote,
  ArrowUpLeft, ArrowUp, ArrowUpRight,
  ArrowLeft, ArrowRight,
  ArrowDownLeft, ArrowDown, ArrowDownRight,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useInterfaceMode } from "@/context/InterfaceModeContext";

// 1. THE DRILL BLUEPRINT: Consolidating 8+ states into one template
const INITIAL_FORM_STATE = {
  distance: "",
  angle: "",
  windAngle: "",
  windIntensity: "still",
  technicalMiss: "",
  isShort: false,
  feel: 0,
  notes: "",
};

const Training = () => {
  const [submitting, setSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const navigate = useNavigate();
  const { mode } = useInterfaceMode();
  const saveSessionMutation = useSaveSession();
  const { profile } = useProfile(); 
  
  // 2. CONSOLIDATED STATE: The "Bucket"
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [kicks, setKicks] = useState<Kick[]>([]);
  const [showMantra, setShowMantra] = useState(false); 

  const isDetailed = mode === "detailed";

  // 3. COMPUTED STATS: Accuracy logic
  const stats = useMemo(() => {
    const madeCount = kicks.filter((k) => k.result === "made").length;
    const totalCount = kicks.length;
    const accuracy = totalCount > 0 ? Math.round((madeCount / totalCount) * 100) : 0;
    return { madeCount, totalCount, accuracy };
  }, [kicks]);

  // 4. VALIDATION: Unlocks buttons only when the "Bucket" is ready
  const canSubmit = useMemo(() => {
    const basicFields = form.distance !== "" && form.angle !== "";
    const detailedFields = !isDetailed || (form.feel > 0 && (form.windIntensity === "still" || form.windAngle !== ""));
    return basicFields && detailedFields;
  }, [form, isDetailed]);

  const resetForm = useCallback(() => setForm(INITIAL_FORM_STATE), []);

  const updateForm = (updates: Partial<typeof INITIAL_FORM_STATE>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  // 5. THE DRILL ENGINE: Handles the log and the Mantra reset
  const logKick = useCallback(
    (result: "made" | "miss") => {
      if (!canSubmit) return;

      const newKick: Kick = {
        id: crypto.randomUUID(),
        seq: kicks.length + 1,
        result,
        kickType: "penalty", // Training defaults to penalty type for stats
        distance: form.distance,
        angle: form.angle,
        notes: form.notes || undefined,
        ...(isDetailed && {
          wind: form.windIntensity === "still" ? "STILL" : `${form.windIntensity}-${form.windAngle}`,
          technicalMiss: result === "miss" 
            ? [form.technicalMiss, form.isShort ? "Short" : ""].filter(Boolean).join(" + ") || undefined
            : undefined,
          feel: form.feel,
        }),
      };

      setKicks((prev) => {
        const newKicks = [...prev, newKick];
        // Circuit Breaker logic: 2 misses in a row triggers Mantra
        if (result === "miss" && prev.length > 0) {
          const lastKick = prev[prev.length - 1];
          if (lastKick.result === "miss") {
            setShowMantra(true);
            setTimeout(() => setShowMantra(false), 10000); 
          }
        }
        return newKicks;
      });

      resetForm();
    },
    [form, kicks, isDetailed, canSubmit, resetForm]
  );

  const deleteKick = useCallback((id: string) => {
    setKicks((prev) => {
      const filtered = prev.filter((k) => k.id !== id);
      return filtered.map((k, i) => ({ ...k, seq: i + 1 }));
    });
  }, []);

  const handleSubmitSet = async () => {
    if (kicks.length === 0) return;
    setSubmitting(true);
    try {
      const session = buildSession("training", kicks);
      await saveSessionMutation.mutateAsync(session);
      navigate(`/session/${session.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    {submitting && <SubmitOverlay />}
    <div className="min-h-screen bg-background pb-44">
      <div className="mx-auto max-w-md px-4 pt-6 flex flex-col gap-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <button onClick={() => kicks.length > 0 ? setShowExitConfirm(true) : navigate("/")} className="rounded-full border border-training bg-transparent px-4 py-1.5 font-display text-xs font-bold tracking-wider text-training uppercase italic">
            TECHNICAL DRILL
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => kicks.length > 0 ? setShowExitConfirm(true) : navigate("/")} className="rounded-lg border border-card-border px-4 py-2 font-display text-xs font-bold tracking-wider text-muted-foreground transition-colors hover:border-destructive hover:text-destructive">CANCEL</button>
            <button onClick={handleSubmitSet} className="rounded-lg bg-training px-5 py-2 font-display text-xs font-bold tracking-wider text-accent-foreground shadow-lg shadow-training/20">SUBMIT SET</button>
          </div>
        </div>

        {/* INPUTS */}
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 font-display text-xs font-black tracking-widest text-foreground uppercase italic">BAND DISTANCE</h3>
            <div className="flex rounded-lg bg-secondary p-1">
              {["0-22m", "22-30m", "30-40m", "40+m"].map((opt) => (
                <button key={opt} onClick={() => updateForm({ distance: opt })} className={`flex-1 rounded-md py-2 font-display text-[10px] font-black tracking-widest transition-all ${form.distance === opt ? "bg-foreground text-background" : "text-muted-foreground"}`}>{opt}</button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-display text-xs font-black tracking-widest text-foreground uppercase italic">POSITION ANGLE</h3>
            <div className="flex rounded-lg bg-secondary p-1">
              {[
                { key: "SL-L", label: "SIDE-L" }, { key: "5m-L", label: "5M" }, { key: "15m-L", label: "15M" },
                { key: "FR", label: "FR" }, { key: "15m-R", label: "15M" }, { key: "5m-R", label: "5M" }, { key: "SL-R", label: "SIDE-R" }
              ].map((opt) => (
                <button key={opt.key} onClick={() => updateForm({ angle: opt.key })} className={`flex-1 rounded-md py-2 font-display text-[10px] font-black tracking-widest transition-all ${form.angle === opt.key ? "bg-foreground text-background" : "text-muted-foreground"}`}>{opt.label}</button>
              ))}
            </div>
          </div>

          {isDetailed && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="font-display text-xs font-black tracking-widest text-foreground uppercase italic">WIND</h3>
                <div className={`grid grid-cols-3 gap-1 transition-all duration-300 ${form.windIntensity === "still" ? "opacity-20 pointer-events-none" : "opacity-100"}`}>
                  {[
                    { label: "TAIL-L", icon: ArrowUpLeft, key: "TAIL-L" }, { label: "TAIL", icon: ArrowUp, key: "TAIL" }, { label: "TAIL-R", icon: ArrowUpRight, key: "TAIL-R" },
                    { label: "LEFT", icon: ArrowLeft, key: "LEFT" }, null, { label: "RIGHT", icon: ArrowRight, key: "RIGHT" },
                    { label: "HEAD-L", icon: ArrowDownLeft, key: "HEAD-L" }, { label: "HEAD", icon: ArrowDown, key: "HEAD" }, { label: "HEAD-R", icon: ArrowDownRight, key: "HEAD-R" }
                  ].map((item, index) => (
                    item ? (
                      <button key={item.key} onClick={() => updateForm({ windAngle: item.key })} className={`flex flex-col items-center justify-center rounded-lg py-2 transition-all ${form.windAngle === item.key ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-secondary text-muted-foreground/50"}`}>
                        <item.icon className="h-4 w-4" />
                        <span className="text-[8px] font-black mt-1 uppercase">{item.label}</span>
                      </button>
                    ) : <div key={`spacer-${index}`} />
                  ))}
                </div>
                <div className="flex rounded-lg bg-secondary p-1">
                  {["still", "low", "med", "high"].map((level) => (
                    <button key={level} onClick={() => updateForm({ windIntensity: level, windAngle: level === "still" ? "" : form.windAngle })} className={`flex-1 rounded-md py-1.5 font-display text-[9px] font-black uppercase tracking-widest transition-all ${form.windIntensity === level ? "bg-foreground text-background shadow-sm" : "text-muted-foreground"}`}>{level}</button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="mb-3 font-display text-xs font-black tracking-widest text-foreground uppercase italic">MISS / DEPTH</h3>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex rounded-lg bg-secondary p-1">
                      {["Hook", "Pure", "Push"].map((opt) => (
                        <button key={opt} onClick={() => updateForm({ technicalMiss: form.technicalMiss === opt ? "" : opt })} className={`flex-1 rounded-md py-1.5 font-display text-[9px] font-black tracking-widest transition-all ${form.technicalMiss === opt ? "bg-foreground text-background" : "text-muted-foreground"}`}>{opt.toUpperCase()}</button>
                      ))}
                    </div>
                    <button onClick={() => updateForm({ isShort: !form.isShort })} className={`rounded-lg py-1.5 font-display text-[9px] font-black tracking-widest transition-all ${form.isShort ? "bg-training text-white shadow-lg shadow-training/20" : "bg-secondary text-muted-foreground"}`}>SHORT</button>
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between px-1">
                    <h3 className="font-display text-xs font-black tracking-widest text-foreground uppercase italic">FEEL</h3>
                    <span className="font-mono text-[10px] font-bold text-matchday">{form.feel}/5</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button key={num} onClick={() => updateForm({ feel: num })} className={`flex-1 rounded-md py-1.5 font-display text-[10px] font-black transition-all ${num <= form.feel ? "bg-pink-500 text-white" : "bg-secondary text-muted-foreground"}`}>{num}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* LOGGING */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 rounded-xl border border-card-border bg-card px-4 py-3">
            <StickyNote className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input type="text" value={form.notes} onChange={(e) => updateForm({ notes: e.target.value })} placeholder="TECHNICAL CUES..." className="w-full bg-transparent font-display text-[11px] font-bold tracking-wider text-foreground focus:outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => logKick("made")} disabled={!canSubmit} className={`flex flex-col items-center justify-center gap-2 rounded-2xl py-8 font-display text-xl font-black italic tracking-tighter transition-all active:scale-95 ${canSubmit ? "bg-success text-white shadow-xl shadow-success/20" : "bg-secondary text-muted-foreground/20 cursor-not-allowed opacity-50"}`}>
              <CheckCircle className="h-8 w-8" /> MADE
            </button>
            <button onClick={() => logKick("miss")} disabled={!canSubmit} className={`flex flex-col items-center justify-center gap-2 rounded-2xl py-8 font-display text-xl font-black italic tracking-tighter transition-all active:scale-95 ${canSubmit ? "bg-training text-white shadow-xl shadow-training/20" : "bg-secondary text-muted-foreground/20 cursor-not-allowed opacity-50"}`}>
              <Circle className="h-8 w-8" /> MISS
            </button>
          </div>

          {/* TIMELINE */}
          <div>
            <h2 className="mb-3 font-display text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase italic">Live Timeline</h2>
            <div className="flex flex-col gap-2">
              {kicks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-card-border p-8 text-center"><p className="font-display text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">Log First Kick...</p></div>
              ) : (
                [...kicks].reverse().map((kick) => (
                  <div key={kick.id} className="rounded-xl border border-card-border bg-card px-4 py-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] font-bold text-muted-foreground">#{kick.seq}</span>
                        {kick.result === "made" ? <CheckCircle className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-training" />}
                        <span className="font-display text-[10px] font-black uppercase tracking-widest text-foreground italic">
                          {kick.distance} • {kick.angle}
                        </span>
                      </div>
                      <button onClick={() => deleteKick(kick.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>

                    {(kick.wind || (kick.feel && kick.feel > 0) || kick.notes || (kick.result === 'miss' && kick.technicalMiss)) && (
                      <div className="ml-7 mt-2 flex flex-col gap-1.5">
                        {kick.result === 'miss' && kick.technicalMiss && (
                          <div className="flex items-center"><span className="rounded bg-training/10 px-1.5 py-0.5 font-display text-[8px] font-bold tracking-widest text-training uppercase border border-training/20">{kick.technicalMiss}</span></div>
                        )}
                        {(kick.wind || (kick.feel && kick.feel > 0)) && (
                          <div className="flex items-center gap-3">
                            {kick.wind && <span className="rounded bg-primary/10 px-1.5 py-0.5 font-display text-[8px] font-bold tracking-widest text-primary uppercase border border-primary/20">WIND: {kick.wind}</span>}
                            {kick.feel && kick.feel > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="font-display text-[8px] font-bold tracking-widest text-muted-foreground uppercase">FEEL</span>
                                <div className="flex items-center gap-0.5">{[1, 2, 3, 4, 5].map((v) => (<div key={v} className={`h-1 w-1 rounded-full ${v <= (kick.feel || 0) ? 'bg-pink-500' : 'bg-secondary border border-card-border'}`} />))}</div>
                              </div>
                            )}
                          </div>
                        )}
                        {kick.notes && (<div className="font-body text-[10px] italic text-muted-foreground flex items-center gap-1"><StickyNote className="h-2.5 w-2.5 shrink-0" /><span>{kick.notes}</span></div>)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER STATS */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-card-border bg-background/80 backdrop-blur-lg px-4 pt-4 pb-8">
        <div className="mx-auto max-w-md flex gap-4 rounded-2xl border border-card-border bg-card p-4 shadow-2xl">
          <div className="flex-1 flex flex-col items-center border-r border-card-border">
            <span className="font-display text-[9px] font-black uppercase tracking-widest text-muted-foreground italic mb-2">Total Kicks</span>
            <span className="font-display text-3xl font-black italic text-foreground leading-none">{stats.madeCount}/{stats.totalCount}</span>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <span className="font-display text-[9px] font-black uppercase tracking-widest text-muted-foreground italic mb-2">Accuracy</span>
            <span className="font-display text-3xl font-black italic text-training leading-none">{stats.accuracy}%</span>
          </div>
        </div>
      </div>

      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Leave Training?</AlertDialogTitle><AlertDialogDescription>You have unsaved kicks. Leaving without submitting will discard all data.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Stay</AlertDialogCancel><AlertDialogAction onClick={() => navigate("/")} className="bg-destructive text-white">Leave</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CIRCUIT BREAKER OVERLAY */}
      {showMantra && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-3xl animate-in fade-in duration-1000">
          <div className="px-8 text-center animate-in zoom-in-95 slide-in-from-bottom-8 duration-1000">
            <div className="mb-8 flex justify-center">
              <div className="h-1 w-16 rounded-full bg-training/30 animate-pulse" />
            </div>
            <p className="mb-4 font-display text-[11px] font-black uppercase tracking-[0.5em] text-training italic">
              PROCESS RESET
            </p>
            <h2 className="max-w-sm font-display text-3xl font-black italic tracking-tight text-foreground leading-tight">
              "{profile?.mantra?.toUpperCase() || "TEMPO. TARGET. TRUST."}"
            </h2>
            <p className="mt-6 font-display text-[9px] font-bold tracking-[0.2em] text-muted-foreground/40 uppercase italic animate-in fade-in duration-1000 delay-500">
              Refine your pillars in Lab Settings
            </p>
            <div className="mt-10 flex justify-center gap-2">
              <div className="h-1 w-8 rounded-full bg-training/10 animate-pulse" />
              <div className="h-1 w-12 rounded-full bg-training/40 animate-pulse delay-150" />
              <div className="h-1 w-8 rounded-full bg-training/10 animate-pulse delay-300" />
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default Training;