import { useState, useCallback, useEffect } from "react";
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

  const placeKicks = kicks.filter((k) => k.kickType !== "try" && k.kickType !== "drop_goal");
  const madeCount = placeKicks.filter((k) => k.result === "made").length;
  const totalCount = placeKicks.length;
  const accuracy = totalCount > 0 ? Math.round((madeCount / totalCount) * 100) : 0;

  const canSubmit = kickType !== "" && bandDistance !== "" && positionAngle !== "" &&
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
        kickType: kickType as "conversion" | "penalty",
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
    setEditDraft({ kickType: kick.kickType, result: kick.result, distance: kick.distance, angle: kick.angle, notes: kick.notes || "", wind: kick.wind, technicalMiss: kick.technicalMiss, feel: kick.feel });
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingKickId) return;
    setKicks((prev) => prev.map((k) => k.id === editingKickId ? { ...k, ...editDraft } : k));
    setEditingKickId(null);
  }, [editingKickId, editDraft]);

  const handleSubmitSet = async () => {
    if (kicks.length === 0) return;
    const session = buildSession("match", kicks, teamName);
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
            className="rounded-full border border-matchday bg-transparent px-4 py-1.5 font-display text-xs font-bold tracking-wider text-matchday"
          >
            MATCH DAY
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
              className="rounded-lg bg-matchday px-5 py-2 font-display text-xs font-bold tracking-wider text-primary-foreground"
            >
              SUBMIT SET
            </button>
          </div>
        </div>

        {/* Match Info */}
        {teamName && (
          <div className="mb-4 px-4">
            <p className="font-display text-xs font-semibold tracking-widest text-muted-foreground">
              VS <span className="text-matchday">{teamName.toUpperCase()}</span>
              {matchDate && <span className="ml-2">• {matchDate}</span>}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-6 px-4">
          {/* Kick Type */}
          <div>
            <h3 className="mb-3 font-display text-sm font-bold tracking-wider text-foreground">
              KICK TYPE
            </h3>
            <div className="flex rounded-lg bg-secondary p-1">
              <button
                onClick={() => setKickType("conversion")}
                className={`flex-1 rounded-md py-2 font-display text-xs font-bold tracking-wider transition-colors ${
                  kickType === "conversion"
                    ? "bg-matchday text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                CONVERSION
              </button>
              <button
                onClick={() => setKickType("penalty")}
                className={`flex-1 rounded-md py-2 font-display text-xs font-bold tracking-wider transition-colors ${
                  kickType === "penalty"
                    ? "bg-matchday text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                PENALTY
              </button>
            </div>
          </div>

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
                              ? "bg-matchday text-primary-foreground"
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
                      <span className="font-display text-sm font-bold text-matchday">
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
                              ? "bg-matchday text-primary-foreground"
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
            <h3 className="mb-3 font-display text-sm font-bold tracking-wider text-matchday">
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

          {/* Try / Drop Goal Buttons (detailed mode only) */}
          {isDetailed && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  const newKick: Kick = {
                    id: crypto.randomUUID(),
                    seq: kicks.length + 1,
                    result: "made",
                    kickType: "try",
                    distance: "",
                    angle: "",
                  };
                  setKicks((prev) => [...prev, newKick]);
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-matchday/20 py-4 font-display text-sm font-black tracking-wider text-matchday shadow transition-all active:scale-95"
              >
                TRY
              </button>
              <button
                onClick={() => {
                  const newKick: Kick = {
                    id: crypto.randomUUID(),
                    seq: kicks.length + 1,
                    result: "made",
                    kickType: "drop_goal",
                    distance: "",
                    angle: "",
                  };
                  setKicks((prev) => [...prev, newKick]);
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-matchday/20 py-4 font-display text-sm font-black tracking-wider text-matchday shadow transition-all active:scale-95"
              >
                DROP GOAL
              </button>
            </div>
          )}

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

          {/* Match Timeline */}
          <div>
            <h2 className="mb-3 font-display text-xs font-semibold tracking-widest text-section-title italic">
              TIMELINE
            </h2>
            {kicks.length === 0 ? (
              <div className="rounded-xl border border-card-border bg-card px-6 py-6 text-center">
                <p className="font-display text-sm text-muted-foreground">
                  Tap MADE or MISS to start logging
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {[...kicks].reverse().map((kick) => {
                  const isEditing = editingKickId === kick.id;
                  return (
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
                            {kick.kickType === "try" ? "TRY" : kick.kickType === "drop_goal" ? "DG" : kick.kickType === "penalty" ? "PEN" : "CON"}
                            {kick.distance ? ` • ${kick.distance}` : ""}{kick.angle ? ` • ${kick.angle}` : ""}
                          </span>
                        </div>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <button onClick={saveEdit} className="text-success transition-colors">
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={() => setEditingKickId(null)} className="text-muted-foreground transition-colors">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(kick)}
                            className="text-muted-foreground transition-colors hover:text-matchday"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {!isEditing && (kick.notes || kick.wind || kick.feel || kick.technicalMiss) && (
                        <div className="ml-8 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-[11px] text-muted-foreground">
                          {kick.feel && (
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <div key={n} className={`h-1.5 w-1.5 rounded-full ${n <= (kick.feel || 0) ? "bg-matchday" : "bg-secondary"}`} />
                              ))}
                            </div>
                          )}
                          {kick.wind && (
                            <span className="flex items-center gap-1">🌬 {kick.wind}</span>
                          )}
                          {kick.technicalMiss && kick.result === "miss" && (
                            <span className="flex items-center gap-1">🎯 {kick.technicalMiss}</span>
                          )}
                          {kick.notes && (
                            <span className="flex items-center gap-1 italic">
                              <StickyNote className="h-3 w-3 shrink-0" />
                              {kick.notes}
                            </span>
                          )}
                        </div>
                      )}

                      {isEditing && (
                        <div className="mt-3 flex flex-col gap-3 border-t border-card-border pt-3">
                          {/* Edit Kick Type */}
                          <div className="flex rounded-lg bg-secondary p-1">
                            {(["conversion", "penalty"] as const).map((t) => (
                              <button
                                key={t}
                                onClick={() => setEditDraft((d) => ({ ...d, kickType: t }))}
                    className={`flex-1 rounded-md py-1.5 font-display text-[11px] font-bold tracking-wider transition-colors ${
                                   editDraft.kickType === t ? "bg-matchday text-primary-foreground" : "text-muted-foreground"
                                 }`}
                              >
                                {t === "conversion" ? "CON" : "PEN"}
                              </button>
                            ))}
                          </div>
                          {/* Edit Result */}
                          <div className="flex rounded-lg bg-secondary p-1">
                            {(["made", "miss"] as const).map((r) => (
                              <button
                                key={r}
                                onClick={() => setEditDraft((d) => ({ ...d, result: r }))}
                                 className={`flex-1 rounded-md py-1.5 font-display text-[11px] font-bold tracking-wider transition-colors ${
                                   editDraft.result === r
                                     ? r === "made" ? "bg-success text-accent-foreground" : "bg-training text-accent-foreground"
                                     : "text-muted-foreground"
                                 }`}
                              >
                                {r.toUpperCase()}
                              </button>
                            ))}
                          </div>
                          {/* Edit Distance */}
                          <div className="flex rounded-lg bg-secondary p-1">
                            {bandOptions.map((opt) => (
                              <button
                                key={opt}
                                onClick={() => setEditDraft((d) => ({ ...d, distance: opt }))}
                                 className={`flex-1 rounded-md py-1.5 font-display text-[11px] font-bold tracking-wider transition-colors ${
                                   editDraft.distance === opt ? "bg-foreground text-background" : "text-muted-foreground"
                                 }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                          {/* Edit Angle */}
                          <div className="flex rounded-lg bg-secondary p-1">
                            {angleOptions.map((opt) => (
                              <button
                                key={opt.key}
                                onClick={() => setEditDraft((d) => ({ ...d, angle: opt.key }))}
                                 className={`flex-1 rounded-md py-1.5 font-display text-[11px] font-bold tracking-wider transition-colors ${
                                   editDraft.angle === opt.key ? "bg-foreground text-background" : "text-muted-foreground"
                                 }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          {/* Edit Wind */}
                          <div>
                            <span className="mb-1 block font-display text-[11px] font-bold tracking-wider text-muted-foreground">WIND</span>
                            <div className="grid grid-cols-3 gap-1">
                              {windGrid.map((item) => {
                                const Icon = item.icon;
                                return (
                                  <button
                                    key={item.key}
                                    onClick={() => setEditDraft((d) => ({ ...d, wind: item.key }))}
                                    className={`flex flex-col items-center justify-center gap-0.5 rounded-md py-1 font-display text-[10px] font-bold tracking-wider transition-colors ${
                                      editDraft.wind === item.key ? "bg-matchday text-primary-foreground" : "bg-secondary text-muted-foreground"
                                    }`}
                                  >
                                    <Icon className="h-3 w-3" />
                                    {item.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          {/* Edit Technical Miss */}
                          <div>
                            <span className="mb-1 block font-display text-[11px] font-bold tracking-wider text-muted-foreground">TECHNICAL MISS</span>
                            <div className="flex gap-2">
                              <div className="flex flex-1 rounded-lg bg-secondary p-1">
                                {missOptions.map((opt) => {
                                  const currentMiss = editDraft.technicalMiss || "";
                                  const hasOpt = currentMiss.includes(opt);
                                  return (
                                    <button
                                      key={opt}
                                      onClick={() => {
                                        const hasShort = currentMiss.includes("Short");
                                        const newDir = hasOpt ? "" : opt;
                                        const newValue = hasShort && newDir ? `Short + ${newDir}` : hasShort ? "Short" : newDir;
                                        setEditDraft((d) => ({ ...d, technicalMiss: newValue }));
                                      }}
                                      className={`flex-1 rounded-md py-1.5 font-display text-[11px] font-bold tracking-wider transition-colors ${
                                        hasOpt ? "bg-foreground text-background" : "text-muted-foreground"
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                              <button
                                onClick={() => {
                                  const currentMiss = editDraft.technicalMiss || "";
                                  const hasShort = currentMiss.includes("Short");
                                  const dirMatch = currentMiss.match(/(Hook|Pure|Push)/);
                                  const dir = dirMatch ? dirMatch[1] : "";
                                  const newValue = hasShort ? dir : (dir ? `Short + ${dir}` : "Short");
                                  setEditDraft((d) => ({ ...d, technicalMiss: newValue }));
                                }}
                                className={`rounded-lg px-3 py-1.5 font-display text-[11px] font-bold tracking-wider transition-colors ${
                                  (editDraft.technicalMiss || "").includes("Short")
                                    ? "bg-training text-accent-foreground"
                                    : "bg-secondary text-muted-foreground"
                                }`}
                              >
                                Short
                              </button>
                            </div>
                          </div>
                          {/* Edit Feel */}
                          <div>
                            <span className="mb-1 block font-display text-[11px] font-bold tracking-wider text-muted-foreground">FEEL</span>
                            <div className="flex gap-1">
                              {feelOptions.map((num) => (
                                <button
                                  key={num}
                                  onClick={() => setEditDraft((d) => ({ ...d, feel: num }))}
                                   className={`flex-1 rounded-md py-1.5 font-display text-[11px] font-bold transition-colors ${
                                     (editDraft.feel || 0) >= num ? "bg-matchday text-primary-foreground" : "bg-secondary text-muted-foreground"
                                   }`}
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                          </div>
                          {/* Edit Notes */}
                          <div className="flex items-center gap-3 rounded-xl border border-card-border bg-secondary px-3 py-2">
                            <StickyNote className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <input
                              type="text"
                              value={editDraft.notes || ""}
                              onChange={(e) => setEditDraft((d) => ({ ...d, notes: e.target.value }))}
                              placeholder="Add a note..."
                              className="w-full bg-transparent font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                            />
                          </div>
                          {/* Delete */}
                          <button
                            onClick={() => deleteKick(kick.id)}
                            className="flex items-center justify-center gap-2 rounded-lg py-2 font-display text-[11px] font-bold tracking-wider text-destructive transition-colors hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            DELETE KICK
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pinned Performance Vitals */}
      <div className="fixed bottom-14 left-0 right-0 border-t border-card-border bg-background px-4 py-3">
        <div className="mx-auto max-w-md">
          <div className="rounded-xl border border-matchday/30 bg-card p-4">
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
                <span className="mt-1 font-display text-3xl font-bold text-matchday">
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
            <AlertDialogTitle>Leave Match Day?</AlertDialogTitle>
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

export default MatchDay;
