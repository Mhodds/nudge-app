import { Session, Kick } from "@/types/session";

export function getMatchStats(sessions: Session[]) {
  // Only use Match data for the primary Dashboard stats
  const matchSessions = sessions.filter((s) => s.type === "match");
  
  // 1. SEASON ACCURACY (Matches Only)
  const allMatchKicks = matchSessions
    .flatMap((s) => s.kicks)
    .filter((k) => k.kickType === "conversion" || k.kickType === "penalty");
  
  const totalMade = allMatchKicks.filter((k) => k.result === "made").length;
  const totalKicks = allMatchKicks.length;
  const seasonAcc = totalKicks > 0 ? Math.round((totalMade / totalKicks) * 100) : 0;

  // 2. RECENT FORM (Last 3 Match Sessions)
  const sortedByDateDesc = [...matchSessions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  const last3 = sortedByDateDesc.slice(0, 3);
  const last3Kicks = last3
    .flatMap((s) => s.kicks)
    .filter((k) => k.kickType === "conversion" || k.kickType === "penalty");
  
  const last3Made = last3Kicks.filter((k) => k.result === "made").length;
  const last3Total = last3Kicks.length;
  const recentForm = last3Total > 0 ? Math.round((last3Made / last3Total) * 100) : 0;

  // 3. STREAKS (Strict Chronological Order)
  const chronologicalKicks = [...matchSessions]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .flatMap((s) => [...s.kicks].sort((a, b) => (a.seq || 0) - (b.seq || 0)))
    .filter((k) => k.kickType === "conversion" || k.kickType === "penalty");

  // Best Streak
  let bestStreak = 0;
  let currentStreak = 0;
  for (const k of chronologicalKicks) {
    if (k.result === "made") {
      currentStreak++;
      if (currentStreak > bestStreak) bestStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  }

  // Live Streak (Counting back from the most recent kick)
  let liveStreak = 0;
  for (let i = chronologicalKicks.length - 1; i >= 0; i--) {
    if (chronologicalKicks[i].result === "made") {
      liveStreak++;
    } else {
      break; 
    }
  }

  // 4. FORM TREND DELTA
  // Compares current 3-match window to the previous 3-match window
  let formDelta: number | null = null;
  if (sortedByDateDesc.length >= 2) {
    const prev3 = sortedByDateDesc.slice(1, 4);
    const prev3Kicks = prev3
      .flatMap((s) => s.kicks)
      .filter((k) => k.kickType === "conversion" || k.kickType === "penalty");
    
    const prev3Total = prev3Kicks.length;
    const prevForm = prev3Total > 0 
      ? Math.round((prev3Kicks.filter(k => k.result === "made").length / prev3Total) * 100) 
      : 0;
    formDelta = recentForm - prevForm;
  }

  return {
    seasonAcc,
    totalMade,
    totalKicks,
    recentForm,
    last3Made,
    last3Total,
    liveStreak,
    bestStreak,
    formDelta,
  };
}