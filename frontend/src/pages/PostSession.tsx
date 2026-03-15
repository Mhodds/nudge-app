import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Trash2, Pencil, X, Check, CheckCircle, Circle, Plus,
  ArrowUpLeft, ArrowUp, ArrowUpRight,
  ArrowLeft, Minus, ArrowRight,
  ArrowDownLeft, ArrowDown, ArrowDownRight,
  StickyNote, CalendarIcon,
} from "lucide-react";
import { useSession, useUpdateSession, useDeleteSession } from "@/hooks/useSessions";
import { Kick, Session } from "@/types/session";
import BottomNav from "@/components/BottomNav";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

const PostSession = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: fetchedSession, isLoading } = useSession(id || "");
  const updateSessionMutation = useUpdateSession();
  const deleteSessionMutation = useDeleteSession();
  const [localSession, setLocalSession] = useState<Session | null>(null);
  const [editingKickId, setEditingKickId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Kick>>({});
  const [showAppend, setShowAppend] = useState(false);
  const [appendDraft, setAppendDraft] = useState<Partial<Kick>>({
    distance: "", angle: "", result: undefined, kickType: undefined,
    wind: "", technicalMiss: "", feel: 0, notes: "",
  });
  const [editingMeta, setEditingMeta] = useState(false);

  // Use localSession if we've made edits, otherwise use fetched data
  const session = localSession || fetchedSession;

  const [metaTeamName, setMetaTeamName] = useState("");
  const [metaTimestamp, setMetaTimestamp] = useState("");

  // Sync meta fields when session loads
  if (session && metaTimestamp === "" && !editingMeta) {
    if (metaTeamName === "" && session.teamName) setMetaTeamName(session.teamName);
    if (metaTimestamp === "") setMetaTimestamp(session.timestamp);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-display text-sm tracking-widest text-muted-foreground animate-pulse">LOADING…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-display text-lg text-muted-foreground">Session not found</p>
      </div>
    );
  }

  const persist = (updated: Session) => {
    setLocalSession(updated);
    updateSessionMutation.mutate(updated);
  };

  const handleDelete = () => {
    deleteSessionMutation.mutate(session.id, {
      onSuccess: () => navigate("/"),
    });
  };

  const recompute = (kicks: Kick[]): Partial<Session> => {
    const madeCount = kicks.filter((k) => k.result === "made").length;
    const totalCount = kicks.length;
    const accuracy = totalCount > 0 ? Math.round((madeCount / totalCount) * 100) : 0;
    const feelsWithValue = kicks.filter((k) => k.feel && k.feel > 0);
    const avgFeel = feelsWithValue.length > 0
      ? Math.round((feelsWithValue.reduce((s, k) => s + (k.feel || 0), 0) / feelsWithValue.length) * 10) / 10
      : 0;
    return { madeCount, totalCount, accuracy, avgFeel };
  };

  const deleteKick = (kickId: string) => {
    const newKicks = session.kicks.filter((k) => k.id !== kickId).map((k, i) => ({ ...k, seq: i + 1 }));
    persist({ ...session, kicks: newKicks, ...recompute(newKicks) });
    setEditingKickId(null);
  };

  const startEdit = (kick: Kick) => {
    setEditingKickId(kick.id);
    setEditDraft({ ...kick });
  };

  const saveEdit = () => {
    if (!editingKickId) return;
    const newKicks = session.kicks.map((k) => k.id === editingKickId ? { ...k, ...editDraft } : k);
    persist({ ...session, kicks: newKicks, ...recompute(newKicks) });
    setEditingKickId(null);
  };

  const appendKick = () => {
    const d = appendDraft;
    if (!d.distance || !d.angle || !d.result) return;
    const newKick: Kick = {
      id: crypto.randomUUID(),
      seq: session.kicks.length + 1,
      result: d.result as "made" | "miss",
      kickType: d.kickType as "conversion" | "penalty" | undefined,
      distance: d.distance,
      angle: d.angle,
      wind: d.wind || undefined,
      technicalMiss: d.technicalMiss || undefined,
      feel: d.feel || undefined,
      notes: d.notes || undefined,
    };
    const newKicks = [...session.kicks, newKick];
    persist({ ...session, kicks: newKicks, ...recompute(newKicks) });
    setAppendDraft({ distance: "", angle: "", result: undefined, kickType: undefined, wind: "", technicalMiss: "", feel: 0, notes: "" });
    setShowAppend(false);
  };

  // Efficiency Matrix data
  const getMatrixCell = (dist: string, angleKey: string) => {
    const cellKicks = session.kicks.filter((k) => k.distance === dist && k.angle === angleKey);
    if (cellKicks.length === 0) return null;
    const made = cellKicks.filter((k) => k.result === "made").length;
    const total = cellKicks.length;
    const pct = Math.round((made / total) * 100);
    return { made, total, pct };
  };




  const saveMetaEdit = () => {
    const updated = { ...session, teamName: metaTeamName || undefined, timestamp: metaTimestamp };
    persist(updated);
    setEditingMeta(false);
  };

  const ts = new Date(metaTimestamp);
  const dateStr = ts.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
  const timeStr = ts.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-md px-4 pt-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="font-display text-lg font-black italic tracking-wider text-primary">
              POST-SESSION DATA
            </h1>
            {!editingMeta ? (
              <div className="mt-0.5 flex items-center gap-2">
                <p className="font-mono text-[11px] tracking-wider text-muted-foreground">
                  {dateStr} • {timeStr}
                  {session.type === "match" && session.teamName && ` • vs ${session.teamName.toUpperCase()}`}
                </p>
                <button
                  onClick={() => setEditingMeta(true)}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="mt-2 flex flex-col gap-2">
                {session.type === "match" && (
                  <div>
                    <label className="mb-1 block font-display text-[11px] font-bold tracking-wider text-muted-foreground">OPPONENT</label>
                    <input
                      type="text"
                      value={metaTeamName}
                      onChange={(e) => setMetaTeamName(e.target.value)}
                      placeholder="Team name..."
                      className="w-full rounded-lg border border-card-border bg-secondary px-3 py-2 font-display text-xs font-bold tracking-wider text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                )}
                <div>
                  <label className="mb-1 block font-display text-[11px] font-bold tracking-wider text-muted-foreground">DATE & TIME</label>
                  <input
                    type="datetime-local"
                    value={metaTimestamp.slice(0, 16)}
                    onChange={(e) => setMetaTimestamp(new Date(e.target.value).toISOString())}
                    className="w-full rounded-lg border border-card-border bg-secondary px-3 py-2 font-display text-xs font-bold tracking-wider text-foreground focus:border-primary focus:outline-none [color-scheme:dark]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveMetaEdit}
                    className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 font-display text-[11px] font-bold tracking-wider text-primary-foreground"
                  >
                    <Check className="h-3.5 w-3.5" /> SAVE
                  </button>
                  <button
                    onClick={() => {
                      setMetaTeamName(session.teamName || "");
                      setMetaTimestamp(session.timestamp);
                      setEditingMeta(false);
                    }}
                    className="flex items-center gap-1 rounded-lg border border-card-border px-3 py-1.5 font-display text-[11px] font-bold tracking-wider text-muted-foreground"
                  >
                    <X className="h-3.5 w-3.5" /> CANCEL
                  </button>
                </div>
              </div>
            )}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-destructive">
                <Trash2 className="h-5 w-5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Session</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove this session from your records.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Performance Vitals */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-card-border bg-card p-5 text-center">
            <span className="font-display text-xs font-semibold tracking-wider text-muted-foreground">
              SUCCESS RATING
            </span>
            <p className="mt-2 font-display text-5xl font-black text-primary">
              {session.accuracy}%
            </p>
            <span className="mt-2 inline-block rounded-full bg-primary/20 px-3 py-0.5 font-display text-[11px] font-bold tracking-wider text-primary">
              {session.madeCount} / {session.totalCount} TOTAL
            </span>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-5 text-center">
            <span className="font-display text-xs font-semibold tracking-wider text-muted-foreground">
              MEAN FEEL
            </span>
            <p className="mt-2 font-display text-5xl font-black text-training">
              {session.avgFeel}<span className="text-2xl text-muted-foreground">/5</span>
            </p>
            <span className="mt-2 inline-block rounded-full bg-training/20 px-3 py-0.5 font-display text-[11px] font-bold tracking-wider text-training">
              {session.type === "match" ? session.teamName?.toUpperCase() || "MATCH" : "TECHNICAL"}
            </span>
          </div>
        </div>

        {/* Efficiency Matrix */}
        <div className="mb-6">
          <h2 className="mb-3 font-display text-xs font-semibold tracking-widest text-section-title italic">
            EFFICIENCY MATRIX
          </h2>
          <div className="overflow-x-auto rounded-xl border border-card-border bg-card p-3">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="pb-2 pr-1 text-left font-display text-[11px] font-bold tracking-wider text-muted-foreground" />
                  {anglePositions.map((a) => (
                    <th key={a.key} className="pb-2 text-center font-display text-[11px] font-bold tracking-wider text-muted-foreground">
                      {a.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {distanceBands.map((dist) => (
                  <tr key={dist}>
                    <td className="pr-1 py-0.5 font-display text-[11px] font-bold tracking-wider text-muted-foreground whitespace-nowrap">
                      {dist}
                    </td>
                    {anglePositions.map((a) => {
                      const cell = getMatrixCell(dist, a.key);
                      return (
                        <td key={a.key} className="p-0.5">
                          <div
                            className={`flex flex-col items-center justify-center rounded-md py-1.5 font-display text-[11px] font-bold leading-tight ${
                              cell
                                ? cell.pct >= 50
                                  ? "bg-primary/30 text-primary"
                                  : "bg-training/30 text-training"
                                : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {cell ? (
                              <>
                                <span>{cell.pct}%</span>
                                <span className="text-[11px]">{cell.made}/{cell.total}</span>
                              </>
                            ) : (
                              <span>—</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* History Logs */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xs font-semibold tracking-widest text-section-title italic">
              HISTORY LOGS
            </h2>
            <button
              onClick={() => setShowAppend(!showAppend)}
              className="flex items-center gap-1 rounded-lg border border-primary/30 px-3 py-1 font-display text-[11px] font-bold tracking-wider text-primary transition-colors hover:bg-primary/10"
            >
              <Plus className="h-3 w-3" /> APPEND
            </button>
          </div>

          {/* Append Form */}
          {showAppend && (
            <div className="mb-3 rounded-xl border border-primary/30 bg-card p-4">
              <p className="mb-3 font-display text-[11px] font-bold tracking-wider text-primary">ADD KICK</p>
              {/* Result */}
              <div className="mb-2 flex rounded-lg bg-secondary p-1">
                {(["made", "miss"] as const).map((r) => (
                  <button key={r} onClick={() => setAppendDraft((d) => ({ ...d, result: r }))}
                    className={`flex-1 rounded-md py-1.5 font-display text-[11px] font-bold tracking-wider transition-colors ${
                      appendDraft.result === r
                        ? r === "made" ? "bg-success text-accent-foreground" : "bg-training text-accent-foreground"
                        : "text-muted-foreground"
                    }`}
                  >{r.toUpperCase()}</button>
                ))}
              </div>
              {/* Kick Type (match only) */}
              {session.type === "match" && (
                <div className="mb-2 flex rounded-lg bg-secondary p-1">
                  {(["conversion", "penalty"] as const).map((t) => (
                    <button key={t} onClick={() => setAppendDraft((d) => ({ ...d, kickType: t }))}
                      className={`flex-1 rounded-md py-1.5 font-display text-[11px] font-bold tracking-wider transition-colors ${
                        appendDraft.kickType === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                      }`}
                    >{t === "conversion" ? "CON" : "PEN"}</button>
                  ))}
                </div>
              )}
              {/* Distance */}
              <div className="mb-2 flex rounded-lg bg-secondary p-1">
                {distanceBands.map((opt) => (
                  <button key={opt} onClick={() => setAppendDraft((d) => ({ ...d, distance: opt }))}
                    className={`flex-1 rounded-md py-1.5 font-display text-[11px] font-bold tracking-wider transition-colors ${
                      appendDraft.distance === opt ? "bg-foreground text-background" : "text-muted-foreground"
                    }`}
                  >{opt}</button>
                ))}
              </div>
              {/* Angle */}
              <div className="mb-2 flex rounded-lg bg-secondary p-1">
                {anglePositions.map((opt) => (
                  <button key={opt.key} onClick={() => setAppendDraft((d) => ({ ...d, angle: opt.key }))}
                    className={`flex-1 rounded-md py-1.5 font-display text-[11px] font-bold tracking-wider transition-colors ${
                      appendDraft.angle === opt.key ? "bg-foreground text-background" : "text-muted-foreground"
                    }`}
                  >{opt.label}</button>
                ))}
              </div>
              {/* Feel */}
              <div className="mb-2 flex gap-1">
                {feelOptions.map((num) => (
                  <button key={num} onClick={() => setAppendDraft((d) => ({ ...d, feel: num }))}
                    className={`flex-1 rounded-md py-1.5 font-display text-[11px] font-bold transition-colors ${
                      (appendDraft.feel || 0) >= num ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}
                  >{num}</button>
                ))}
              </div>
              {/* Notes */}
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-card-border bg-secondary px-3 py-2">
                <StickyNote className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <input type="text" value={appendDraft.notes || ""} onChange={(e) => setAppendDraft((d) => ({ ...d, notes: e.target.value }))}
                  placeholder="Notes..." className="w-full bg-transparent font-body text-xs text-foreground placeholder:text-muted-foreground focus:outline-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={appendKick}
                  disabled={!appendDraft.result || !appendDraft.distance || !appendDraft.angle}
                  className="flex-1 rounded-lg bg-primary py-2 font-display text-xs font-bold tracking-wider text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >SAVE KICK</button>
                <button onClick={() => setShowAppend(false)}
                  className="rounded-lg border border-card-border px-4 py-2 font-display text-xs font-bold tracking-wider text-muted-foreground"
                >CANCEL</button>
              </div>
            </div>
          )}

          {/* Kick List */}
          <div className="flex flex-col gap-2">
            {[...session.kicks].reverse().map((kick) => {
              const isEditing = editingKickId === kick.id;
              return (
                <div key={kick.id} className="rounded-xl border border-card-border bg-card px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-display text-xs font-bold text-muted-foreground">#{kick.seq}</span>
                      {kick.result === "made" ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : (
                        <Circle className="h-5 w-5 text-training" />
                      )}
                      <span className="font-display text-xs font-bold tracking-wider text-foreground">
                        {kick.kickType === "try" ? "TRY" : kick.kickType === "drop_goal" ? "DROP GOAL" : kick.kickType === "penalty" ? "PEN" : kick.kickType === "conversion" ? "CON" : ""}
                        {kick.distance ? ` • ${kick.distance}` : ""}{kick.angle ? ` • ${kick.angle}` : ""}
                      </span>
                    </div>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <button onClick={saveEdit} className="text-success"><Check className="h-4 w-4" /></button>
                        <button onClick={() => setEditingKickId(null)} className="text-muted-foreground"><X className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEdit(kick)} className="text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => deleteKick(kick.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    )}
                  </div>
                  {/* Feel dots + notes */}
                  {!isEditing && (
                    <div className="ml-8 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {kick.feel && (
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <div key={n} className={`h-1.5 w-1.5 rounded-full ${n <= (kick.feel || 0) ? "bg-primary" : "bg-secondary"}`} />
                          ))}
                        </div>
                      )}
                      {kick.wind && <span className="font-body text-[11px] text-muted-foreground">🌬 {kick.wind}</span>}
                      {kick.technicalMiss && kick.result === "miss" && <span className="font-body text-[11px] text-muted-foreground">🎯 {kick.technicalMiss}</span>}
                      {kick.notes && (
                        <span className="font-body text-[11px] italic text-muted-foreground">
                          <StickyNote className="mr-0.5 inline h-2.5 w-2.5" />{kick.notes}
                        </span>
                      )}
                    </div>
                  )}
                  {/* Edit panel */}
                  {isEditing && (
                    <div className="mt-3 flex flex-col gap-2 border-t border-card-border pt-3">
                      <div className="flex rounded-lg bg-secondary p-1">
                        {(["made", "miss"] as const).map((r) => (
                          <button key={r} onClick={() => setEditDraft((d) => ({ ...d, result: r }))}
                            className={`flex-1 rounded-md py-1.5 font-display text-[11px] font-bold tracking-wider transition-colors ${
                              editDraft.result === r ? r === "made" ? "bg-success text-accent-foreground" : "bg-training text-accent-foreground" : "text-muted-foreground"
                            }`}>{r.toUpperCase()}</button>
                        ))}
                      </div>
                      <div className="flex rounded-lg bg-secondary p-1">
                        {distanceBands.map((opt) => (
                          <button key={opt} onClick={() => setEditDraft((d) => ({ ...d, distance: opt }))}
                            className={`flex-1 rounded-md py-1.5 font-display text-[11px] font-bold tracking-wider transition-colors ${
                              editDraft.distance === opt ? "bg-foreground text-background" : "text-muted-foreground"
                            }`}>{opt}</button>
                        ))}
                      </div>
                      <div className="flex rounded-lg bg-secondary p-1">
                        {anglePositions.map((opt) => (
                          <button key={opt.key} onClick={() => setEditDraft((d) => ({ ...d, angle: opt.key }))}
                            className={`flex-1 rounded-md py-1.5 font-display text-[11px] font-bold tracking-wider transition-colors ${
                              editDraft.angle === opt.key ? "bg-foreground text-background" : "text-muted-foreground"
                            }`}>{opt.label}</button>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        {feelOptions.map((num) => (
                          <button key={num} onClick={() => setEditDraft((d) => ({ ...d, feel: num }))}
                            className={`flex-1 rounded-md py-1.5 font-display text-[11px] font-bold transition-colors ${
                              (editDraft.feel || 0) >= num ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                            }`}>{num}</button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 rounded-lg border border-card-border bg-secondary px-3 py-2">
                        <StickyNote className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <input type="text" value={editDraft.notes || ""} onChange={(e) => setEditDraft((d) => ({ ...d, notes: e.target.value }))}
                          placeholder="Notes..." className="w-full bg-transparent font-body text-xs text-foreground placeholder:text-muted-foreground focus:outline-none" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default PostSession;
