import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { buildSession } from "@/lib/sessions";
import { useSaveSession } from "@/hooks/useSessions";
import { useProfile } from "@/hooks/useProfile"; 
import { Kick } from "@/types/session";
import SubmitOverlay from "@/components/SubmitOverlay";
import {
  CheckCircle, Circle, Trash2, StickyNote,
  ArrowUpLeft, ArrowUp, ArrowUpRight,
  ArrowLeft, Minus, ArrowRight,
  ArrowDownLeft, ArrowDown, ArrowDownRight,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useInterfaceMode } from "@/context/InterfaceModeContext";

const Training = () => {
  const [submitting, setSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const navigate = useNavigate();
  const { mode } = useInterfaceMode();
  const saveSessionMutation = useSaveSession();
  const { profile } = useProfile(); 
  
  const [bandDistance, setBandDistance] = useState("");
  const [positionAngle, setPositionAngle] = useState("");
  
  // FIX: Defaulting windAngle to "CALM" so it's ready immediately
  const [windAngle, setWindAngle] = useState("CALM");
  const [windIntensity, setWindIntensity] = useState("still");
  
  const [technicalMiss, setTechnicalMiss] = useState("");
  const [isShort, setIsShort] = useState(false);
  const [feel, setFeel] = useState(0);
  const [notes, setNotes] = useState("");
  const [kicks, setKicks] = useState<Kick[]>([]);
  const [showMantra, setShowMantra] = useState(false); 

  const bandOptions = ["0-22m", "22-30m", "30-40m", "40+m"];
  
  const angleOptions = [
    { key: "SL-L", label: "SIDE-L" },
    { key: "5m-L", label: "5M" },
    { key: "15m-L", label: "15M" },
    { key: "FR", label: "FR" },
    { key: "15m-R", label: "15M" },
    { key: "5m-R", label: "5M" },
    { key: "SL-R", label: "SIDE-R" },
  ];

  const windGrid = [
    { label: "TAIL-L", icon: ArrowUpLeft, key: "TAIL-L" },
    { label: "TAIL", icon: ArrowUp, key: "TAIL" },
    { label: "TAIL-R", icon: ArrowUpRight, key: "TAIL-R" },
    { label: "LEFT", icon: ArrowLeft, key: "LEFT" },
    { label: "CALM", icon: Minus, key: "CALM" },
    { label: "RIGHT", icon: ArrowRight, key: "RIGHT" },
    { label: "HEAD-L", icon: ArrowDownLeft, key: "HEAD-L" },
    { label: "HEAD", icon: ArrowDown, key: "HEAD" },
    { label: "HEAD-R", icon: ArrowDownRight, key: "HEAD-R" },
  ];

  const missOptions = ["Hook", "Pure", "Push"];
  const feelOptions = [1, 2, 3, 4, 5];
  const isDetailed = mode === "detailed";

  const madeCount = kicks.filter((k) => k.result === "made").length;
  const totalCount = kicks.length;
  const accuracy = totalCount > 0 ? Math.round((madeCount / totalCount) * 100) : 0;

  // SUBMISSION LOGIC: Now allows submission if windAngle is pre-filled (which it is)
  const canSubmit = bandDistance !== "" && positionAngle !== "" &&
    (!isDetailed || (windAngle !== "" && feel > 0));

  const buildTechnicalMiss = () => {
    if (isShort && technicalMiss) return `${technicalMiss} + Short`;
    if (isShort) return "Short";
    return technicalMiss;
  };

  const logKick = useCallback(
    (result: "made" | "miss") => {
      if (!canSubmit) return;
      const newKick: Kick = {
        id: crypto.randomUUID(),
        seq: kicks.length + 1,
        result,
        distance: bandDistance,
        angle: positionAngle,
        notes: notes || undefined,
        ...(isDetailed && {
          wind: windIntensity === "still" ? "STILL" : `${windIntensity}-${windAngle}`,
          technicalMiss: result === "miss" ? buildTechnicalMiss() : undefined,
          feel,
        }),
      };

      setKicks((prev) => {
        const newKicks = [...prev, newKick];
        if (result === "miss" && prev.length > 0) {
          const lastKick = prev[prev.length - 1];
          if (lastKick.result === "miss") {
            setShowMantra(true);
            setTimeout(() => setShowMantra(false), 10000); 
          }
        }
        return newKicks;
      });

      // Reset for next kick - maintaining "STILL/CALM" as the default baseline
      setBandDistance(""); 
      setPositionAngle(""); 
      setWindAngle("CALM"); 
      setWindIntensity("still");
      setTechnicalMiss(""); 
      setIsShort(false); 
      setFeel(0); 
      setNotes("");
    },
    [canSubmit, kicks.length, bandDistance, positionAngle, isDetailed, windIntensity, windAngle, technicalMiss, isShort, feel, notes]
  );

  const deleteKick = useCallback((id: string) => {
    setKicks((prev) => {
      const filtered = prev.filter((k) => k.id !== id);
      return filtered.map((k, i) => ({ ...k, seq: i + 1 }));
    });
  }, []);

  const handleSubmitSet = async () => {
    if (kicks.length === 0) return;
    const session = buildSession("training", kicks);
    await saveSessionMutation.mutateAsync(session);
    navigate(`/session/${session.id}`);
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
              {bandOptions.map((opt) => (
                <button key={opt} onClick={() => setBandDistance(opt)} className={`flex-1 rounded-md py-2 font-display text-[10px] font-black tracking-widest transition-all ${bandDistance === opt ? "bg-foreground text-background" : "text-muted-foreground"}`}>{opt}</button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-display text-xs font-black tracking-widest text-foreground uppercase italic">POSITION ANGLE</h3>
            <div className="flex rounded-lg bg-secondary p-1">
              {angleOptions.map((opt) => (
                <button key={opt.key} onClick={() => setPositionAngle(opt.key)} className={`flex-1 rounded-md py-2 font-display text-[10px] font-black tracking-widest transition-all ${positionAngle === opt.key ? "bg-foreground text-background" : "text-muted-foreground"}`}>{opt.label}</button>
              ))}
            </div>
          </div>

          {isDetailed && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="font-display text-xs font-black tracking-widest text-foreground uppercase italic">WIND</h3>
                <div className={`grid grid-cols-3 gap-1 transition-all duration-300 ${windIntensity === "still" ? "opacity-20 pointer-events-none" : "opacity-100"}`}>
                  {windGrid.map((item) => (
                    <button key={item.key} onClick={() => setWindAngle(item.key)} className={`flex flex-col items-center justify-center rounded-lg py-2 transition-all ${windAngle === item.key ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-secondary text-muted-foreground/50"}`}>
                      <item.icon className="h-4 w-4" />
                      <span className="text-[8px] font-black mt-1 uppercase">{item.label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex rounded-lg bg-secondary p-1">
                  {["still", "low", "med", "high"].map((level) => (
                    <button key={level} onClick={() => { setWindIntensity(level); if (level === "still") setWindAngle("CALM"); }} className={`flex-1 rounded-md py-1.5 font-display text-[9px] font-black uppercase tracking-widest transition-all ${windIntensity === level ? "bg-foreground text-background shadow-sm" : "text-muted-foreground"}`}>{level}</button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="mb-3 font-display text-xs font-black tracking-widest text-foreground uppercase italic">MISS / DEPTH</h3>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex rounded-lg bg-secondary p-1">
                      {missOptions.map((opt) => (
                        <button key={opt} onClick={() => setTechnicalMiss(technicalMiss === opt ? "" : opt)} className={`flex-1 rounded-md py-1.5 font-display text-[9px] font-black tracking-widest transition-all ${technicalMiss === opt ? "bg-foreground text-background" : "text-muted-foreground"}`}>{opt.toUpperCase()}</button>
                      ))}
                    </div>
                    <button onClick={() => setIsShort(!isShort)} className={`rounded-lg py-1.5 font-display text-[9px] font-black tracking-widest transition-all ${isShort ? "bg-training text-white shadow-lg shadow-training/20" : "bg-secondary text-muted-foreground"}`}>SHORT</button>
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between px-1">
                    <h3 className="font-display text-xs font-black tracking-widest text-foreground uppercase italic">FEEL</h3>
                    <span className="font-mono text-[10px] font-bold text-matchday">{feel}/5</span>
                  </div>
                  <div className="flex gap-1">
                    {feelOptions.map((num) => (
                      <button key={num} onClick={() => setFeel(num)} className={`flex-1 rounded-md py-1.5 font-display text-[10px] font-black transition-all ${num <= feel ? "bg-pink-500 text-white" : "bg-secondary text-muted-foreground"}`}>{num}</button>
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
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="TECHNICAL CUES..." className="w-full bg-transparent font-display text-[11px] font-bold tracking-wider text-foreground placeholder:text-muted-foreground focus:outline-none" />
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
                        <span className="font-display text-xs font-bold text-muted-foreground">#{kick.seq}</span>
                        {kick.result === "made" ? <CheckCircle className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-training" />}
                        <span className="font-display text-xs font-bold tracking-wider text-foreground uppercase">
                          {kick.distance} • {kick.angle}
                        </span>
                      </div>
                    </div>
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
            <span className="font-display text-3xl font-black italic text-foreground leading-none">{madeCount}/{totalCount}</span>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <span className="font-display text-[9px] font-black uppercase tracking-widest text-muted-foreground italic mb-2">Accuracy</span>
            <span className="font-display text-3xl font-black italic text-training leading-none">{accuracy}%</span>
          </div>
        </div>
      </div>

      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Leave Training?</AlertDialogTitle><AlertDialogDescription>You have unsaved kicks. Leaving without submitting will discard all data.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Stay</AlertDialogCancel><AlertDialogAction onClick={() => navigate("/")}>Leave</AlertDialogAction></AlertDialogFooter>
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