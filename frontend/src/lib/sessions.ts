import { supabase } from "@/integrations/supabase/client";
import { Session, Kick } from "@/types/session";

const STORAGE_KEY = "kicking-sessions";

// --- 1. LEGACY ADAPTER ---
// Ensures old data format (SIDE-L) matches our new UI standard (SL)
const normalizeKick = (k: any): Kick => ({
  id: k.id,
  seq: k.seq,
  result: k.result as "made" | "miss",
  kickType: k.kick_type as Kick["kickType"],
  distance: k.distance,
  angle: k.angle === "SIDE-L" ? "SL-L" : k.angle === "SIDE-R" ? "SL-R" : k.angle,
  wind: k.wind || undefined,
  technicalMiss: k.technical_miss || undefined,
  feel: k.feel || undefined,
  notes: k.notes || undefined,
});

// ── Supabase-backed async functions ──

export async function getSessions(): Promise<Session[]> {
  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("*")
    .order("timestamp", { ascending: false });

  if (error || !sessions) return [];

  const sessionIds = sessions.map((s) => s.id);
  if (sessionIds.length === 0) return [];

  const { data: kicks } = await supabase
    .from("kicks")
    .select("*")
    .in("session_id", sessionIds);

  const kicksBySession: Record<string, Kick[]> = {};
  for (const k of kicks || []) {
    const mapped = normalizeKick(k);
    if (!kicksBySession[k.session_id]) kicksBySession[k.session_id] = [];
    kicksBySession[k.session_id].push(mapped);
  }

  return sessions.map((s) => ({
    id: s.id,
    type: s.type as "match" | "training",
    timestamp: s.timestamp,
    teamName: s.team_name || undefined,
    kicks: (kicksBySession[s.id] || []).sort((a, b) => a.seq - b.seq),
    madeCount: s.made_count,
    totalCount: s.total_count,
    accuracy: s.accuracy,
    avgFeel: Number(s.avg_feel),
    tries: s.tries || 0,
    pointsTotal: s.points_total || 0,
  }));
}

// FIXED: Added back the paginated fetch that was missing
export async function getSessionsPaginated(
  page: number,
  pageSize = 15
): Promise<Session[]> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("*")
    .order("timestamp", { ascending: false })
    .range(from, to);

  if (error || !sessions || sessions.length === 0) return [];

  const sessionIds = sessions.map((s) => s.id);

  const { data: kicks } = await supabase
    .from("kicks")
    .select("*")
    .in("session_id", sessionIds);

  const kicksBySession: Record<string, Kick[]> = {};
  for (const k of kicks || []) {
    const mapped = normalizeKick(k);
    if (!kicksBySession[k.session_id]) kicksBySession[k.session_id] = [];
    kicksBySession[k.session_id].push(mapped);
  }

  return sessions.map((s) => ({
    id: s.id,
    type: s.type as "match" | "training",
    timestamp: s.timestamp,
    teamName: s.team_name || undefined,
    kicks: (kicksBySession[s.id] || []).sort((a, b) => a.seq - b.seq),
    madeCount: s.made_count,
    totalCount: s.total_count,
    accuracy: s.accuracy,
    avgFeel: Number(s.avg_feel),
    tries: s.tries || 0,
    pointsTotal: s.points_total || 0,
  }));
}

export async function getSession(id: string): Promise<Session | undefined> {
  const { data: s } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!s) return undefined;

  const { data: kicks } = await supabase
    .from("kicks")
    .select("*")
    .eq("session_id", id)
    .order("seq", { ascending: true });

  return {
    id: s.id,
    type: s.type as "match" | "training",
    timestamp: s.timestamp,
    teamName: s.team_name || undefined,
    kicks: (kicks || []).map(normalizeKick),
    madeCount: s.made_count,
    totalCount: s.total_count,
    accuracy: s.accuracy,
    avgFeel: Number(s.avg_feel),
    tries: s.tries || 0,
    pointsTotal: s.points_total || 0,
  };
}

export async function saveSession(session: Session): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error: sessionError } = await supabase.from("sessions").insert({
    id: session.id,
    user_id: user.id,
    type: session.type,
    timestamp: session.timestamp,
    team_name: session.teamName || null,
    made_count: session.madeCount,
    total_count: session.totalCount,
    accuracy: session.accuracy,
    avg_feel: session.avgFeel,
    tries: session.tries || 0,
    points_total: session.pointsTotal || 0,
  });

  if (sessionError) throw sessionError;

  if (session.kicks.length > 0) {
    const kickRows = session.kicks.map((k) => ({
      id: k.id,
      session_id: session.id,
      seq: k.seq,
      result: k.result,
      kick_type: k.kickType || null,
      distance: k.distance,
      angle: k.angle,
      wind: k.wind || null,
      technical_miss: k.technicalMiss || null,
      feel: k.feel || null,
      notes: k.notes || null,
    }));

    const { error: kicksError } = await supabase.from("kicks").insert(kickRows);
    if (kicksError) throw kicksError;
  }
}

export async function updateSession(updated: Session): Promise<void> {
  const points = (updated.tries || 0) * 5 + updated.kicks.reduce((acc, k) => {
    if (k.result !== 'made') return acc;
    return acc + (k.kickType === 'conversion' ? 2 : 3);
  }, 0);

  const { error: sessionError } = await supabase
    .from("sessions")
    .update({
      type: updated.type,
      timestamp: updated.timestamp,
      team_name: updated.teamName || null,
      made_count: updated.madeCount,
      total_count: updated.totalCount,
      accuracy: updated.accuracy,
      avg_feel: updated.avgFeel,
      tries: updated.tries || 0,
      points_total: points,
    })
    .eq("id", updated.id);

  if (sessionError) throw sessionError;

  const kickRows = updated.kicks.map((k) => ({
    id: k.id,
    session_id: updated.id,
    seq: k.seq,
    result: k.result,
    kick_type: k.kickType || null,
    distance: k.distance,
    angle: k.angle,
    wind: k.wind || null,
    technical_miss: k.technicalMiss || null,
    feel: k.feel || null,
    notes: k.notes || null,
  }));

  if (kickRows.length > 0) {
    const { error: upsertError } = await supabase
      .from("kicks")
      .upsert(kickRows, { onConflict: "id" });
    if (upsertError) throw upsertError;

    const currentIds = updated.kicks.map(k => k.id);
    await supabase.from("kicks")
      .delete()
      .eq("session_id", updated.id)
      .not("id", "in", `(${currentIds.join(",")})`);
  } else {
    await supabase.from("kicks").delete().eq("session_id", updated.id);
  }
}

export async function deleteSession(id: string): Promise<void> {
  await supabase.from("sessions").delete().eq("id", id);
}

export function buildSession(
  type: "match" | "training",
  kicks: Kick[],
  teamName?: string
): Session {
  const placeKicks = kicks.filter((k) => k.kickType !== "try" && k.kickType !== "drop_goal");
  const madeCount = placeKicks.filter((k) => k.result === "made").length;
  const totalCount = placeKicks.length;
  const accuracy = totalCount > 0 ? Math.round((madeCount / totalCount) * 100) : 0;
  
  const triesCount = kicks.filter(k => k.kickType === 'try').length;
  
  const kickPoints = kicks.reduce((acc, k) => {
    if (k.result !== 'made') return acc;
    if (k.kickType === 'conversion') return acc + 2;
    if (k.kickType === 'penalty' || k.kickType === 'drop_goal') return acc + 3;
    return acc;
  }, 0);

  const feelsWithValue = placeKicks.filter((k) => k.feel && k.feel > 0);
  const avgFeel = feelsWithValue.length > 0
    ? Math.round((feelsWithValue.reduce((sum, k) => sum + (k.feel || 0), 0) / feelsWithValue.length) * 10) / 10
    : 0;

  return {
    id: crypto.randomUUID(),
    type,
    timestamp: new Date().toISOString(),
    teamName,
    kicks,
    madeCount,
    totalCount,
    accuracy,
    avgFeel,
    tries: triesCount,
    pointsTotal: (triesCount * 5) + kickPoints,
  };
}

// FIXED: Added back the migration utility that was missing
export async function migrateLocalStorageToCloud(): Promise<number> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return 0;
  try {
    const localSessions: Session[] = JSON.parse(raw);
    if (!Array.isArray(localSessions) || localSessions.length === 0) return 0;
    for (const session of localSessions) { await saveSession(session); }
    localStorage.removeItem(STORAGE_KEY);
    return localSessions.length;
  } catch { return 0; }
}