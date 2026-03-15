import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { buildSession } from "@/lib/sessions";
import { useSaveSession } from "@/hooks/useSessions";
import { Kick } from "@/types/session";
import SubmitOverlay from "@/components/SubmitOverlay";
import {
  CheckCircle, Circle, Trash2,
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

const Training = () => {
  const [submitting, setSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const navigate = useNavigate();
  const { mode } = useInterfaceMode();
  const saveSessionMutation = useSaveSession();
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

  const madeCount = kicks.filter((k) => k.result === "made").length;
  const totalCount = kicks.length;
  const accuracy = totalCount > 0 ? Math.round((madeCount / totalCount) * 100) : 0;

  const canSubmit = bandDistance !== "" && positionAngle !== "" &&
    (!isDetailed || (windAngle !== "" && (technicalMiss !== "" || isShort) && feel > 0));

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
        distance: bandDistance,
        angle: positionAngle,
        notes: notes || undefined,
        ...(isDetailed && {
          wind: windAngle,
          technicalMiss: buildTechnicalMiss(),
          feel,
        }),
      };
      setKicks((prev) => [...prev, newKick]);
      setBandDistance("");
      setPositionAngle("");
      setWindAngle("");
      setTechnicalMiss("");
      setIsShort(false);
      setFeel(0);
      setNotes("");
    },
    [canSubmit, kicks.length, bandDistance, positionAngle, isDetailed, windAngle, technicalMiss, isShort, feel, notes]
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
      <div className="mx-auto max-w-md">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 pt-6 pb-4">
          <button
            onClick={() => kicks.length > 0 ? setShowExitConfirm(true) : navigate("/")}
            className="rounded-full border border-training bg-transparent px-4 py-1.5 font-display text-xs font-bold tracking-wider text-training"
          >
            TECHNICAL DRILL
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => kicks.length > 0 ? setShowExitConfirm(true) : navigate("/")}
              className="rounded-lg border border-card-border px-4 py-2 font-display text-xs font-bold tracking-wider text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
            >
              CANCEL
            </button>
            <button
              onClick={handleSubmitSet}
              className="rounded-lg bg-training px-5 py-2 font-display text-xs font-bold tracking-wider text-accent-foreground"
            >
              SUBMIT SET
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6 px-4">
          {/* Band Distance */}
          <div>
            <h3 className="mb-3 font-display text-sm font-bold tracking-wider text-foreground">
              BAND DISTANCE
            </h3>
            <div className="flex rounded-lg bg-secondary p-1">
              {bandOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setBandDistance(opt)}
                  className={`flex-1 rounded-md py-2 font-display text-xs font-bold tracking-wider transition-colors ${
                    bandDistance === opt
                      ? "bg-foreground text-background"
                      : "text-muted-foreground"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Position Angle */}
          <div>
            <h3 className="mb-3 font-display text-sm font-bold tracking-wider text-foreground">
              POSITION ANGLE
            </h3>
            <div className="flex rounded-lg bg-secondary p-1">
              {angleOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setPositionAngle(opt.key)}
                  className={`flex-1 rounded-md py-2 font-display text-xs font-bold tracking-wider transition-colors ${
                    positionAngle === opt.key
                      ? "bg-foreground text-background"
                      : "text-muted-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Mode Sections */}
          {isDetailed && (
            <>
              <div className="grid grid-cols-2 gap-4">
                {/* Wind Angle */}
                <div>
                  <h3 className="mb-3 font-display text-sm font-bold tracking-wider text-foreground">
                    WIND ANGLE
                  </h3>
                  <div className="grid grid-cols-3 gap-1.5">
                    {windGrid.map((item) => {
                      const Icon = item.icon;
                      const isWActive = windAngle === item.key;
                      return (
                        <button
                          key={item.key}
                          onClick={() => setWindAngle(item.key)}
                          className={`flex flex-col items-center justify-center gap-0.5 rounded-lg py-2 font-display text-[11px] font-bold tracking-wider transition-colors ${
                            isWActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Technical Miss + Feel */}
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="mb-3 font-display text-sm font-bold tracking-wider text-foreground">
                      TECHNICAL MISS
                    </h3>
                    <div className="flex gap-2">
                      <div className="flex flex-1 rounded-lg bg-secondary p-1">
                        {missOptions.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setTechnicalMiss(technicalMiss === opt ? "" : opt)}
                            className={`flex-1 rounded-md py-2 font-display text-xs font-bold tracking-wider transition-colors ${
                              technicalMiss === opt
                                ? "bg-foreground text-background"
                                : "text-muted-foreground"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setIsShort(!isShort)}
                        className={`rounded-lg px-3 py-2 font-display text-xs font-bold tracking-wider transition-colors ${
                          isShort
                            ? "bg-training text-accent-foreground"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        Short
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-display text-sm font-bold tracking-wider text-foreground">
                        FEEL
                      </h3>
                      <span className="font-display text-sm font-bold text-primary">
                        {feel}/5
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      {feelOptions.map((num) => (
                        <button
                          key={num}
                          onClick={() => setFeel(num)}
                          className={`flex-1 rounded-md py-2 font-display text-sm font-bold transition-colors ${
                            num <= feel
                              ? "bg-training text-accent-foreground"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Notes (always visible) */}
          <div>
            <h3 className="mb-3 font-display text-sm font-bold tracking-wider text-primary">
              NOTES
            </h3>
            <div className="flex items-center gap-3 rounded-xl border border-card-border bg-card px-4 py-3">
              <StickyNote className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Technical cues..."
                className="w-full bg-transparent font-body text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>

          {/* Made / Miss Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => logKick("made")}
              disabled={!canSubmit}
              className={`flex flex-col items-center justify-center gap-3 rounded-xl py-8 font-display text-xl font-black tracking-wider shadow-lg transition-all active:scale-95 ${
                canSubmit ? "bg-success text-accent-foreground" : "bg-success/30 text-accent-foreground/60 cursor-not-allowed"
              }`}
            >
              <CheckCircle className="h-10 w-10" />
              MADE
            </button>
            <button
              onClick={() => logKick("miss")}
              disabled={!canSubmit}
              className={`flex flex-col items-center justify-center gap-3 rounded-xl py-8 font-display text-xl font-black tracking-wider shadow-lg transition-all active:scale-95 ${
                canSubmit ? "bg-training text-accent-foreground" : "bg-training/30 text-accent-foreground/60 cursor-not-allowed"
              }`}
            >
              <Circle className="h-10 w-10" />
              MISS
            </button>
          </div>

          {/* Kick History Log */}
          <div>
            <h2 className="mb-3 font-display text-xs font-semibold tracking-widest text-section-title italic">
              HISTORY
            </h2>
            {kicks.length === 0 ? (
              <div className="rounded-xl border border-card-border bg-card px-6 py-6 text-center">
                <p className="font-display text-sm text-muted-foreground">
                  Tap MADE or MISS to start logging
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {[...kicks].reverse().map((kick) => (
                  <div
                    key={kick.id}
                    className="rounded-xl border border-card-border bg-card px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-display text-xs font-bold text-muted-foreground">
                          #{kick.seq}
                        </span>
                        {kick.result === "made" ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <Circle className="h-5 w-5 text-training" />
                        )}
                        <span className="font-display text-xs font-bold tracking-wider text-foreground">
                          {kick.distance} • {kick.angle}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteKick(kick.id)}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {kick.notes && (
                      <div className="ml-8 mt-1.5 flex items-center gap-1.5 font-body text-[11px] text-muted-foreground italic">
                        <StickyNote className="h-3 w-3 shrink-0" />
                        {kick.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pinned Performance Vitals */}
      <div className="fixed bottom-14 left-0 right-0 border-t border-card-border bg-background px-4 py-3">
        <div className="mx-auto max-w-md">
          <div className="rounded-xl border border-training/30 bg-card p-4">
            <div className="grid grid-cols-2 divide-x divide-card-border">
              <div className="flex flex-col items-center">
                <span className="font-display text-xs font-semibold tracking-wider text-muted-foreground">
                  TOTAL VOLUME
                </span>
                <span className="mt-1 font-display text-3xl font-bold text-foreground">
                  {madeCount}/{totalCount}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-display text-xs font-semibold tracking-wider text-muted-foreground">
                  ACCURACY
                </span>
                <span className="mt-1 font-display text-3xl font-bold text-training">
                  {accuracy}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Training?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved kicks. Leaving without submitting will discard all data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/")}>Leave</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </>
  );
};

export default Training;
