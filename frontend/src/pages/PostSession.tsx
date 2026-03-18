import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Trash2, Pencil, X, Check, CheckCircle, Circle, Plus,
  ArrowUpLeft, ArrowUp, ArrowUpRight,
  ArrowLeft, Minus, ArrowRight,
  ArrowDownLeft, ArrowDown, ArrowDownRight,
  StickyNote,
} from "lucide-react";
import { useSession, useUpdateSession, useDeleteSession } from "@/hooks/useSessions";
import { Kick, Session } from "@/types/session";
import BottomNav from "@/components/BottomNav";
import EfficiencyMatrix from "@/components/EfficiencyMatrix";
import MissAnalysisChart from "@/components/MissAnalysisChart";
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

const missOptions = ["Pure", "Hook", "Push"];
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

  const session = localSession || fetchedSession;

  const [metaTeamName, setMetaTeamName] = useState("");
  const [metaTimestamp, setMetaTimestamp] = useState("");

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
    const placeKicks = kicks.filter((k) => k.kickType === "conversion" || k.kickType === "penalty");
    const madeCount = placeKicks.filter((k) => k.result === "made").length;
    const totalCount = placeKicks.length;
    const accuracy = totalCount > 0 ? Math.round((madeCount / totalCount) * 100) : 0;
    const feelsWithValue = placeKicks.filter((k) => k.feel && k.feel > 0);
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

  const saveMetaEdit = () => {
    const updated = { ...session, teamName: metaTeamName || undefined, timestamp: metaTimestamp };
    persist(updated);
    setEditingMeta(false);
  };

  const ts = new Date(metaTimestamp);
  const dateStr = ts.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
  const timeStr = ts.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const missedKicks = session.kicks.filter(k => k.result === 'miss');
  const totalMisses = missedKicks.length;
  const shortMisses = missedKicks.filter(k => k.technicalMiss?.toLowerCase().includes('short')).length;

  const pureCount = missedKicks.filter(k => k.technicalMiss?.toLowerCase().includes('pure')).length;
  const hookCount = missedKicks.filter(k => k.technicalMiss?.toLowerCase().includes('hook')).length;
  const pushCount = missedKicks.filter(k => k.technicalMiss?.toLowerCase().includes('push')).length;
  
  const unspecifiedCount = Math.max(0, totalMisses - (pureCount + hookCount + pushCount));

  const chartData = [
    { name: 'Pure', value: pureCount },
    { name: 'Hook', value: hookCount },
    { name: 'Push', value: pushCount },
    { name: 'Unspecified', value: unspecifiedCount },
  ].filter(item => item.value > 0);

  // --- Reusable Component for the Form Fields ---
  const renderEditorFields = (
    draft: Partial<Kick>, 
    setDraft: React.Dispatch<React.SetStateAction<Partial<Kick>>>
  ) => {
    // Technical Miss builder logic
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
            <button key={r} onClick={() => setDraft((d) => ({ ...d, result: r, technicalMiss: r === 'made' ? undefined : d.technicalMiss }))}
              className={`flex-1 rounded-md py-1.5 font-display text-[11px] font-bold tracking-wider transition-colors ${
                draft.result === r ? (r === "made" ? "bg-success text-accent-foreground" : "bg-training text-accent-foreground") : "text-muted-foreground"
              }`}
            >{r.toUpperCase()}</button>
          ))}
        </div>

        {/* TECHNICAL MISS (Only shows if result is Miss) */}
        {draft.result === 'miss' && (
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

        {/* DISTANCE & ANGLE (Hide for Tries/DGs) */}
        {draft.kickType !== 'try' && draft.kickType !== 'drop_goal' && (
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

        {/* WIND (3x3 Grid) */}
        <div className="flex flex-wrap gap-1 rounded-lg bg-secondary p-1">
          {windGrid.map((w) => (
            <button key={w.key} onClick={() => setDraft((d) => ({ ...d, wind: d.wind === w.key ? undefined : w.key }))}
              className={`flex-1 min-w-[30%] rounded-md py-1.5 flex items-center justify-center gap-1 font-display text-[9px] font-bold tracking-wider transition-colors ${
                draft.wind === w.key ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground"
              }`}
            >
              <w.icon className="h-3 w-3" /> {w.label}
            </button>
          ))}
        </div>

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

        {/* NOTES */}
        <div className="flex items-center gap-2 rounded-lg border border-card-border bg-secondary px-3 py-2">
          <StickyNote className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input type="text" value={draft.notes || ""} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
            placeholder="Notes..." className="w-full bg-transparent font-body text-xs text-foreground placeholder:text-muted-foreground focus:outline-none" />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-md px-4 pt-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="font-display text-lg font-black italic tracking-wider text-primary">POST-SESSION DATA</h1>
            {!editingMeta ? (
              <div className="mt-0.5 flex items-center gap-2">
                <p className="font-mono text-[11px] tracking-wider text-muted-foreground">
                  {dateStr} • {timeStr}
                  {session.type === "match" && session.teamName && ` • vs ${session.teamName.toUpperCase()}`}
                </p>
                <button onClick={() => setEditingMeta(true)} className="text-muted-foreground transition-colors hover:text-primary"><Pencil className="h-3.5 w-3.5" /></button>
              </div>
            ) : (
              <div className="mt-2 flex flex-col gap-2">
                {session.type === "match" && (
                  <div>
                    <label className="mb-1 block font-display text-[11px] font-bold tracking-wider text-muted-foreground">OPPONENT</label>
                    <input type="text" value={metaTeamName} onChange={(e) => setMetaTeamName(e.target.value)} placeholder="Team name..." className="w-full rounded-lg border border-card-border bg-secondary px-3 py-2 font-display text-xs font-bold tracking-wider text-foreground focus:border-primary focus:outline-none" />
                  </div>
                )}
                <div>
                  <label className="mb-1 block font-display text-[11px] font-bold tracking-wider text-muted-foreground">DATE & TIME</label>
                  <input type="datetime-local" value={metaTimestamp.slice(0, 16)} onChange={(e) => setMetaTimestamp(new Date(e.target.value).toISOString())} className="w-full rounded-lg border border-card-border bg-secondary px-3 py-2 font-display text-xs font-bold tracking-wider text-foreground focus:outline-none [color-scheme:dark]" />
                </div>
                <div className="flex gap-2">
                  <button onClick={saveMetaEdit} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 font-display text-[11px] font-bold tracking-wider text-primary-foreground"><Check className="h-3.5 w-3.5" /> SAVE</button>
                  <button onClick={() => { setMetaTeamName(session.teamName || ""); setMetaTimestamp(session.timestamp); setEditingMeta(false); }} className="flex items-center gap-1 rounded-lg border border-card-border px-3 py-1.5 font-display text-[11px] font-bold tracking-wider text-muted-foreground"><X className="h-3.5 w-3.5" /> CANCEL</button>
                </div>
              </div>
            )}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-destructive"><Trash2 className="h-5 w-5" /></button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Session</AlertDialogTitle>
                <AlertDialogDescription>This will permanently remove this session from your records.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-card-border bg-card p-5 text-center">
            <span className="font-display text-xs font-semibold tracking-wider text-muted-foreground">SUCCESS RATING</span>
            <p className="mt-2 font-display text-5xl font-black text-primary">{session.accuracy}%</p>
            <span className="mt-2 inline-block rounded-full bg-primary/20 px-3 py-0.5 font-display text-[11px] font-bold tracking-wider text-primary">{session.madeCount} / {session.totalCount} TOTAL</span>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-5 text-center">
            <span className="font-display text-xs font-semibold tracking-wider text-muted-foreground">MEAN FEEL</span>
            <p className="mt-2 font-display text-5xl font-black text-training">{session.avgFeel}<span className="text-2xl text-muted-foreground">/5</span></p>
            <span className="mt-2 inline-block rounded-full bg-training/20 px-3 py-0.5 font-display text-[11px] font-bold tracking-wider text-training">{session.type === "match" ? session.teamName?.toUpperCase() || "MATCH" : "TECHNICAL"}</span>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="mb-3 font-display text-xs font-semibold tracking-widest text-section-title italic">EFFICIENCY MATRIX</h2>
          <EfficiencyMatrix sessions={[session]} />
        </div>

        {chartData.length > 0 && (
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xs font-semibold tracking-widest text-section-title italic">MISS ANALYSIS</h2>
              <div className="rounded-full bg-secondary px-2.5 py-0.5 font-mono text-[9px] font-bold text-primary border border-primary/20">{totalMisses} TOTAL</div>
            </div>
            <MissAnalysisChart data={chartData} totalMisses={totalMisses} shortMisses={shortMisses} />
          </div>
        )}

        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xs font-semibold tracking-widest text-section-title italic">HISTORY LOGS</h2>
            <button onClick={() => setShowAppend(!showAppend)} className="flex items-center gap-1 rounded-lg border border-primary/30 px-3 py-1 font-display text-[11px] font-bold tracking-wider text-primary transition-colors hover:bg-primary/10"><Plus className="h-3 w-3" /> APPEND</button>
          </div>

          {showAppend && (
            <div className="mb-3 rounded-xl border border-primary/30 bg-card p-4">
              <p className="mb-1 font-display text-[11px] font-bold tracking-wider text-primary">ADD KICK</p>
              
              {renderEditorFields(appendDraft, setAppendDraft as any)}

              <div className="flex gap-2 mt-3">
                <button onClick={appendKick} disabled={!appendDraft.result || !appendDraft.distance || !appendDraft.angle} className="flex-1 rounded-lg bg-primary py-2 font-display text-xs font-bold tracking-wider text-primary-foreground disabled:opacity-50">SAVE KICK</button>
                <button onClick={() => setShowAppend(false)} className="rounded-lg border border-card-border px-4 py-2 font-display text-xs font-bold tracking-wider text-muted-foreground">CANCEL</button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {[...session.kicks].reverse().map((kick) => {
              const isEditing = editingKickId === kick.id;
              
              if (isEditing) {
                return (
                  <div key={kick.id} className="rounded-xl border border-primary/50 bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-card-border pb-2">
                      <span className="font-display text-xs font-bold text-primary">EDIT KICK #{kick.seq}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={saveEdit} className="rounded bg-success/20 px-2 py-1 text-success transition-colors hover:bg-success/30"><Check className="h-4 w-4" /></button>
                        <button onClick={() => setEditingKickId(null)} className="rounded bg-destructive/20 px-2 py-1 text-destructive transition-colors hover:bg-destructive/30"><X className="h-4 w-4" /></button>
                      </div>
                    </div>
                    
                    {renderEditorFields(editDraft, setEditDraft as any)}
                  </div>
                );
              }

              return (
                <div key={kick.id} className="rounded-xl border border-card-border bg-card px-4 py-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-display text-xs font-bold text-muted-foreground">#{kick.seq}</span>
                      {kick.result === "made" ? <CheckCircle className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-training" />}
                      <span className="font-display text-xs font-bold tracking-wider text-foreground uppercase">
                        {kick.kickType === 'try' ? "TRY" : kick.kickType === 'drop_goal' ? "DROP GOAL" : `${kick.distance || "—"} • ${kick.angle || "—"}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(kick)} className="text-muted-foreground hover:text-primary transition-colors"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => deleteKick(kick.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>

                  {(kick.wind || (kick.feel && kick.feel > 0) || kick.notes || (kick.result === 'miss' && kick.technicalMiss)) && (
                    <div className="ml-8 mt-2 flex flex-col gap-1.5">
                      {kick.result === 'miss' && kick.technicalMiss && (
                        <div className="flex items-center">
                          <span className="rounded bg-training/10 px-1.5 py-0.5 font-display text-[9px] font-bold tracking-widest text-training uppercase border border-training/20">
                            {kick.technicalMiss}
                          </span>
                        </div>
                      )}
                      {(kick.wind || (kick.feel && kick.feel > 0)) && (
                        <div className="flex items-center gap-3">
                          {kick.wind && (
                            <span className="rounded bg-secondary/50 px-1.5 py-0.5 font-display text-[9px] font-bold tracking-widest text-muted-foreground uppercase border border-card-border">
                              WIND: {kick.wind}
                            </span>
                          )}
                          {kick.feel && kick.feel > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="font-display text-[9px] font-bold tracking-widest text-muted-foreground uppercase">FEEL</span>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((v) => (
                                  <div key={v} className={`h-1.5 w-1.5 rounded-full ${v <= (kick.feel || 0) ? 'bg-pink-500' : 'bg-secondary border border-card-border'}`} />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {kick.notes && (
                        <div className="font-body text-[11px] italic text-muted-foreground flex items-center gap-1">
                          <StickyNote className="h-2.5 w-2.5 shrink-0" />
                          <span>{kick.notes}</span>
                        </div>
                      )}
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