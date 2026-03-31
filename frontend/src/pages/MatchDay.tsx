import { useState, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { buildSession } from "@/lib/sessions";
import { useSaveSession } from "@/hooks/useSessions";
import { Kick } from "@/types/session";
import SubmitOverlay from "@/components/SubmitOverlay";
import { CheckCircle, Circle, Trash2, StickyNote } from "lucide-react";
import WindDial from "@/components/WindDial";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useInterfaceMode } from "@/context/InterfaceModeContext";

// 1. THE BLUEPRINT
const INITIAL_FORM_STATE = {
  kickType: "" as Kick["kickType"] | "",
  distance: "",
  angle: "",
  windAngle: "",
  windIntensity: "still",
  technicalMiss: "",
  isShort: false,
  feel: 0,
  notes: "",
};

const MatchDay = () => {
  const [submitting, setSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { mode } = useInterfaceMode();
  const saveSessionMutation = useSaveSession();
  const { teamName } = (location.state as { teamName?: string }) || {};

  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [kicks, setKicks] = useState<Kick[]>([]);

  const isDetailed = mode === "detailed";

  const stats = useMemo(() => {
    const placeKicks = kicks.filter((k) => k.kickType === "conversion" || k.kickType === "penalty");
    const madeCount = placeKicks.filter((k) => k.result === "made").length;
    const totalCount = placeKicks.length;
    const accuracy = totalCount > 0 ? Math.round((madeCount / totalCount) * 100) : 0;
    return { madeCount, totalCount, accuracy };
  }, [kicks]);

  const canSubmit = useMemo(() => {
    if (form.kickType === "try" || form.kickType === "drop_goal") return true;
    
    const basicFields = form.kickType !== "" && form.distance !== "" && form.angle !== "";
    const detailedFields = !isDetailed || (form.feel > 0 && (form.windIntensity === "still" || form.windAngle !== ""));
    return basicFields && detailedFields;
  }, [form, isDetailed]);

  const resetForm = useCallback(() => setForm(INITIAL_FORM_STATE), []);

  const updateForm = (updates: Partial<typeof INITIAL_FORM_STATE>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  const handleLog = useCallback(
    (typeOverride?: Kick["kickType"], result: "made" | "miss" = "made") => {
      const activeType = typeOverride || form.kickType;
      const isPlaceKick = activeType === "conversion" || activeType === "penalty";

      const newKick: Kick = {
        id: crypto.randomUUID(),
        seq: kicks.length + 1,
        result,
        kickType: activeType as Kick["kickType"],
        distance: isPlaceKick ? form.distance : "",
        angle: isPlaceKick ? form.angle : "",
        notes: form.notes || undefined,
        ...(isDetailed && isPlaceKick && {
          wind: form.windIntensity === "still" ? "STILL" : `${form.windIntensity}-${form.windAngle}`,
          technicalMiss: result === "miss" 
            ? [form.technicalMiss, form.isShort ? "Short" : ""].filter(Boolean).join(" + ") || undefined
            : undefined,
          feel: form.feel,
        }),
      };

      setKicks((prev) => [...prev, newKick]);
      resetForm();
    },
    [form, kicks.length, isDetailed, resetForm]
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
      const session = buildSession("match", kicks, teamName);
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
          <button className="rounded-full border border-matchday bg-transparent px-4 py-1.5 font-display text-xs font-bold tracking-wider text-matchday uppercase italic">
            MATCH DAY
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => kicks.length > 0 ? setShowExitConfirm(true) : navigate("/")} className="rounded-lg border border-card-border px-4 py-2 font-display text-xs font-bold tracking-wider text-muted-foreground transition-colors hover:border-destructive hover:text-destructive">CANCEL</button>
            <button onClick={handleSubmitSet} className="rounded-lg bg-matchday px-5 py-2 font-display text-xs font-bold tracking-wider text-primary-foreground shadow-lg shadow-matchday/20">SUBMIT SET</button>
          </div>
        </div>

        {teamName && (
          <p className="font-display text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase italic">
            VS <span className="text-matchday">{teamName.toUpperCase()}</span>
          </p>
        )}

        <div className="space-y-6">
          <div>
            <h3 className="mb-3 font-display text-xs font-black tracking-widest text-foreground uppercase italic">KICK TYPE</h3>
            <div className="flex rounded-lg bg-secondary p-1">
              {["conversion", "penalty"].map((type) => (
                <button key={type} onClick={() => updateForm({ kickType: type as any })} className={`flex-1 rounded-md py-2 font-display text-[11px] font-black tracking-wider transition-all ${form.kickType === type ? "bg-matchday text-primary-foreground" : "text-muted-foreground"}`}>{type.toUpperCase()}</button>
              ))}
            </div>
          </div>

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
                { key: "SL-L", label: "SL" }, { key: "5m-L", label: "5M" }, { key: "15m-L", label: "15M" },
                { key: "FR", label: "FR" }, { key: "15m-R", label: "15M" }, { key: "5m-R", label: "5M" }, { key: "SL-R", label: "SL" }
              ].map((opt) => (
                <button key={opt.key} onClick={() => updateForm({ angle: opt.key })} className={`flex-1 rounded-md py-2 font-display text-[10px] font-black tracking-widest transition-all ${form.angle === opt.key ? "bg-foreground text-background" : "text-muted-foreground"}`}>{opt.label}</button>
              ))}
            </div>
          </div>

          {/* THE SHARED WIND DIAL COMPONENT IS HERE */}
          {isDetailed && (
            <div className="grid grid-cols-2 gap-4">
              
              <WindDial 
                intensity={form.windIntensity} 
                angle={form.windAngle} 
                onChange={updateForm} 
                activeColorClass="bg-matchday text-primary-foreground shadow-lg shadow-matchday/20"
              />

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

        {/* LOGGING CONTROLS */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 rounded-xl border border-card-border bg-card px-4 py-3">
            <StickyNote className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input type="text" value={form.notes} onChange={(e) => updateForm({ notes: e.target.value })} placeholder="NOTES..." className="w-full bg-transparent font-display text-[11px] font-bold tracking-wider text-foreground placeholder:text-muted-foreground focus:outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleLog("try")} className="flex items-center justify-center gap-2 rounded-xl border border-matchday/30 bg-matchday/5 py-4 font-display text-xs font-black tracking-[0.2em] text-matchday transition-all active:scale-95 italic">TRY</button>
            <button onClick={() => handleLog("drop_goal")} className="flex items-center justify-center gap-2 rounded-xl border border-matchday/30 bg-matchday/5 py-4 font-display text-xs font-black tracking-[0.2em] text-matchday transition-all active:scale-95 italic">DROP GOAL</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleLog(undefined, "made")} disabled={!canSubmit} className={`flex flex-col items-center justify-center gap-2 rounded-2xl py-8 font-display text-xl font-black italic tracking-tighter transition-all active:scale-95 ${canSubmit ? "bg-success text-white shadow-xl shadow-success/20" : "bg-secondary text-muted-foreground/20 cursor-not-allowed opacity-50"}`}>
              <CheckCircle className="h-8 w-8" /> MADE
            </button>
            <button onClick={() => handleLog(undefined, "miss")} disabled={!canSubmit} className={`flex flex-col items-center justify-center gap-2 rounded-2xl py-8 font-display text-xl font-black italic tracking-tighter transition-all active:scale-95 ${canSubmit ? "bg-training text-white shadow-xl shadow-training/20" : "bg-secondary text-muted-foreground/20 cursor-not-allowed opacity-50"}`}>
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
                          {kick.kickType.toUpperCase()} {kick.distance && `• ${kick.distance}`} {kick.angle && `• ${kick.angle}`}
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
                            {kick.wind && <span className="rounded bg-matchday/10 px-1.5 py-0.5 font-display text-[8px] font-bold tracking-widest text-matchday uppercase border border-matchday/20">WIND: {kick.wind}</span>}
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
            <span className="font-display text-3xl font-black italic text-matchday leading-none">{stats.accuracy}%</span>
          </div>
        </div>
      </div>

      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Discard Progress?</AlertDialogTitle><AlertDialogDescription>Closing this match session will permanently delete the kicks you've logged so far.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Continue Match</AlertDialogCancel><AlertDialogAction onClick={() => navigate("/")} className="bg-destructive text-white">Discard Session</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </>
  );
};

export default MatchDay;