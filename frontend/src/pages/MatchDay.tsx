import { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { buildSession } from "@/lib/sessions";
import { useSaveSession } from "@/hooks/useSessions";
import { Kick } from "@/types/session";
import SubmitOverlay from "@/components/SubmitOverlay";
import {
  CheckCircle, Circle, Trash2, Pencil, X, Check,
  ArrowUpLeft, ArrowUp, ArrowUpRight,
  ArrowLeft, Minus, ArrowRight,
  ArrowDownLeft, ArrowDown, ArrowDownRight,
  StickyNote,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useInterfaceMode } from "@/context/InterfaceModeContext";

const MatchDay = () => {
  const [submitting, setSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { mode } = useInterfaceMode();
  const saveSessionMutation = useSaveSession();
  const { teamName, matchDate } = (location.state as { teamName?: string; matchDate?: string }) || {};

  const [kickType, setKickType] = useState<"conversion" | "penalty" | "">("");
  const [bandDistance, setBandDistance] = useState("");
  const [positionAngle, setPositionAngle] = useState("");
  const [windAngle, setWindAngle] = useState("");
  const [technicalMiss, setTechnicalMiss] = useState("");
  const [isShort, setIsShort] = useState(false);
  const [feel, setFeel] = useState(0);
  const [notes, setNotes] = useState("");
  const [kicks, setKicks] = useState<Kick[]>([]);

  const bandOptions = ["0-22m", "22-30m", "30-40m", "40+m"];
  const angleOptions = [
    { key: "SL-L", label: "SL" },
    { key: "5m-L", label: "5m" },
    { key: "15m-L", label: "15m" },
    { key: "FR", label: "FR" },
    { key: "15m-R", label: "15m" },
    { key: "5m-R", label: "5m" },
    { key: "SL-R", label: "SL" },
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
  const [editingKickId, setEditingKickId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Kick>>({});

  // FIXED: Logic to strictly separate Place Kicks from Tries/DGs for Accuracy
  const placeKicks = kicks.filter((k) => k.kickType === "conversion" || k.kickType === "penalty");
  const madeCount = placeKicks.filter((k) => k.result === "made").length;
  const totalCount = placeKicks.length;
  const accuracy = totalCount > 0 ? Math.round((madeCount / totalCount) * 100) : 0;

  const canSubmit = kickType !== "" && bandDistance !== "" && positionAngle !== "" &&
    (!isDetailed || (windAngle !== "" && (technicalMiss !== "" || isShort || true) && feel > 0));

  const buildTechnicalMiss = () => {
    if (isShort && technicalMiss) return `Short + ${technicalMiss}`;
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
        kickType: kickType as "conversion" | "penalty",
        distance: bandDistance,
        angle: positionAngle,
        notes: notes || undefined,
        ...(isDetailed && {
          wind: windAngle,
          technicalMiss: result === "miss" ? buildTechnicalMiss() : undefined,
          feel,
        }),
      };
      setKicks((prev) => [...prev, newKick]);
      setKickType("");
      setBandDistance("");
      setPositionAngle("");
      setWindAngle("");
      setTechnicalMiss("");
      setIsShort(false);
      setFeel(0);
      setNotes("");
    },
    [canSubmit, kicks.length, kickType, bandDistance, positionAngle, isDetailed, windAngle, technicalMiss, isShort, feel, notes]
  );

  const deleteKick = useCallback((id: string) => {
    setKicks((prev) => {
      const filtered = prev.filter((k) => k.id !== id);
      return filtered.map((k, i) => ({ ...k, seq: i + 1 }));
    });
    setEditingKickId(null);
  }, []);

  const startEdit = useCallback((kick: Kick) => {
    setEditingKickId(kick.id);
    setEditDraft({ ...kick });
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingKickId) return;
    setKicks((prev) => prev.map((k) => k.id === editingKickId ? { ...k, ...editDraft } : k));
    setEditingKickId(null);
  }, [editingKickId, editDraft]);

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
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between px-4 pt-6 pb-4">
          <button className="rounded-full border border-matchday bg-transparent px-4 py-1.5 font-display text-xs font-bold tracking-wider text-matchday uppercase italic">
            MATCH DAY
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => kicks.length > 0 ? setShowExitConfirm(true) : navigate("/")}
              className="rounded-lg border border-card-border px-4 py-2 font-display text-xs font-bold tracking-wider text-muted-foreground"
            >
              CANCEL
            </button>
            <button
              onClick={handleSubmitSet}
              className="rounded-lg bg-matchday px-5 py-2 font-display text-xs font-bold tracking-wider text-primary-foreground shadow-lg shadow-matchday/20"
            >
              SUBMIT SET
            </button>
          </div>
        </div>

        {teamName && (
          <div className="mb-4 px-4">
            <p className="font-display text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase italic">
              VS <span className="text-matchday">{teamName.toUpperCase()}</span>
            </p>
          </div>
        )}

        <div className="flex flex-col gap-6 px-4">
          <div>
            <h3 className="mb-3 font-display text-xs font-black tracking-widest text-foreground uppercase italic">KICK TYPE</h3>
            <div className="flex rounded-lg bg-secondary p-1">
              <button
                onClick={() => setKickType("conversion")}
                className={`flex-1 rounded-md py-2 font-display text-[11px] font-black tracking-wider transition-all ${
                  kickType === "conversion" ? "bg-matchday text-primary-foreground" : "text-muted-foreground"
                }`}
              >CONVERSION</button>
              <button
                onClick={() => setKickType("penalty")}
                className={`flex-1 rounded-md py-2 font-display text-[11px] font-black tracking-wider transition-all ${
                  kickType === "penalty" ? "bg-matchday text-primary-foreground" : "text-muted-foreground"
                }`}
              >PENALTY</button>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-display text-xs font-black tracking-widest text-foreground uppercase italic">BAND DISTANCE</h3>
            <div className="flex rounded-lg bg-secondary p-1">
              {bandOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setBandDistance(opt)}
                  className={`flex-1 rounded-md py-2 font-display text-[10px] font-black tracking-widest transition-all ${
                    bandDistance === opt ? "bg-foreground text-background" : "text-muted-foreground"
                  }`}
                >{opt}</button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-display text-xs font-black tracking-widest text-foreground uppercase italic">POSITION ANGLE</h3>
            <div className="flex rounded-lg bg-secondary p-1">
              {angleOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setPositionAngle(opt.key)}
                  className={`flex-1 rounded-md py-2 font-display text-[10px] font-black tracking-widest transition-all ${
                    positionAngle === opt.key ? "bg-foreground text-background" : "text-muted-foreground"
                  }`}
                >{opt.label}</button>
              ))}
            </div>
          </div>

          {isDetailed && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="mb-3 font-display text-xs font-black tracking-widest text-foreground uppercase italic">WIND</h3>
                <div className="grid grid-cols-3 gap-1">
                  {windGrid.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.key}
                        onClick={() => setWindAngle(item.key)}
                        className={`flex flex-col items-center justify-center rounded-lg py-2 transition-all ${
                          windAngle === item.key ? "bg-matchday text-primary-foreground" : "bg-secondary text-muted-foreground/50"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-[8px] font-black mt-1 uppercase">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="mb-3 font-display text-xs font-black tracking-widest text-foreground uppercase italic">MISS / DEPTH</h3>
                  <div className="flex gap-1.5">
                    <div className="flex flex-1 rounded-lg bg-secondary p-1">
                      {missOptions.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setTechnicalMiss(technicalMiss === opt ? "" : opt)}
                          className={`flex-1 rounded-md py-1.5 font-display text-[9px] font-black tracking-widest transition-all ${
                            technicalMiss === opt ? "bg-foreground text-background" : "text-muted-foreground"
                          }`}
                        >{opt.toUpperCase()}</button>
                      ))}
                    </div>
                    <button
                      onClick={() => setIsShort(!isShort)}
                      className={`rounded-lg px-2.5 py-1.5 font-display text-[9px] font-black tracking-widest transition-all ${
                        isShort ? "bg-training text-white shadow-lg shadow-training/20" : "bg-secondary text-muted-foreground"
                      }`}
                    >SHORT</button>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between px-1">
                    <h3 className="font-display text-xs font-black tracking-widest text-foreground uppercase italic">FEEL</h3>
                    <span className="font-mono text-[10px] font-bold text-matchday">{feel}/5</span>
                  </div>
                  <div className="flex gap-1">
                    {feelOptions.map((num) => (
                      <button
                        key={num}
                        onClick={() => setFeel(num)}
                        className={`flex-1 rounded-md py-1.5 font-display text-[10px] font-black transition-all ${
                          num <= feel ? "bg-matchday text-primary-foreground" : "bg-secondary text-muted-foreground"
                        }`}
                      >{num}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-3 font-display text-xs font-black tracking-widest text-matchday uppercase italic">NOTES</h3>
            <div className="flex items-center gap-3 rounded-xl border border-card-border bg-card px-4 py-3">
              <StickyNote className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="TECHNICAL CUES..."
                className="w-full bg-transparent font-display text-[11px] font-bold tracking-wider text-foreground placeholder:text-muted-foreground/30 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                const newKick: Kick = {
                  id: crypto.randomUUID(),
                  seq: kicks.length + 1,
                  result: "made",
                  kickType: "try",
                  distance: "", angle: ""
                };
                setKicks((prev) => [...prev, newKick]);
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-matchday/30 bg-matchday/5 py-4 font-display text-xs font-black tracking-[0.2em] text-matchday transition-all active:scale-95 italic"
            >TRY +5</button>
            <button
              onClick={() => {
                const newKick: Kick = {
                  id: crypto.randomUUID(),
                  seq: kicks.length + 1,
                  result: "made",
                  kickType: "drop_goal",
                  distance: "", angle: ""
                };
                setKicks((prev) => [...prev, newKick]);
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-matchday/30 bg-matchday/5 py-4 font-display text-xs font-black tracking-[0.2em] text-matchday transition-all active:scale-95 italic"
            >DROP GOAL</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => logKick("made")}
              disabled={!canSubmit}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl py-8 font-display text-xl font-black italic tracking-tighter transition-all active:scale-95 ${
                canSubmit ? "bg-success text-success-foreground shadow-xl shadow-success/20" : "bg-secondary text-muted-foreground/20 cursor-not-allowed opacity-50"
              }`}
            >
              <CheckCircle className="h-8 w-8" /> MADE
            </button>
            <button
              onClick={() => logKick("miss")}
              disabled={!canSubmit}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl py-8 font-display text-xl font-black italic tracking-tighter transition-all active:scale-95 ${
                canSubmit ? "bg-training text-white shadow-xl shadow-training/20" : "bg-secondary text-muted-foreground/20 cursor-not-allowed opacity-50"
              }`}
            >
              <Circle className="h-8 w-8" /> MISS
            </button>
          </div>

          <div className="mt-4">
            <h2 className="mb-3 font-display text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase italic">Live Timeline</h2>
            <div className="flex flex-col gap-2">
              {kicks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-card-border p-8 text-center">
                  <p className="font-display text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">Log First Kick...</p>
                </div>
              ) : (
                [...kicks].reverse().map((kick) => (
                  <div key={kick.id} className="flex items-center justify-between rounded-xl border border-card-border bg-card/50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] font-bold text-muted-foreground">#{kick.seq}</span>
                      {kick.result === "made" ? <CheckCircle className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-training" />}
                      <span className="font-display text-[10px] font-black uppercase tracking-widest text-foreground italic">
                        {kick.kickType.toUpperCase()} {kick.distance && `• ${kick.distance}`} {kick.angle && `• ${kick.angle}`}
                      </span>
                    </div>
                    <button onClick={() => deleteKick(kick.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-card-border bg-background/80 backdrop-blur-lg px-4 pt-4 pb-8">
        <div className="mx-auto max-w-md">
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-card-border bg-card p-4 shadow-2xl">
            <div className="flex flex-col items-center border-r border-card-border">
              <span className="font-display text-[9px] font-black uppercase tracking-widest text-muted-foreground italic leading-none mb-2">Total Kicks</span>
              <span className="font-display text-3xl font-black italic text-foreground leading-none">{madeCount}/{totalCount}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-display text-[9px] font-black uppercase tracking-widest text-muted-foreground italic leading-none mb-2">Accuracy</span>
              <span className="font-display text-3xl font-black italic text-matchday leading-none">{accuracy}%</span>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Progress?</AlertDialogTitle>
            <AlertDialogDescription>Closing this match session will permanently delete the kicks you've logged so far.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Match</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/")} className="bg-destructive text-destructive-foreground">Discard Session</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </>
  );
};

export default MatchDay;