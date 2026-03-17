import { Session, Kick } from "@/types/session";

export function getMatchStats(sessions: Session[]) {
  // Only use Match data for the Dashboard stats
  const matchSessions = sessions.filter((s) => s.type === "match");

  // 1. Season Acc (Matches Only)
  const allKicks = matchSessions
    .flatMap((s) => s.kicks)
    .filter((k) => k.kickType === "conversion" || k.kickType === "penalty");
  
  const totalMade = allKicks.filter((k) => k.result === "made").length;
  const totalKicks = allKicks.length;
  const seasonAcc = totalKicks > 0 ? Math.round((totalMade / totalKicks) * 100) : 0;

  // 2. Recent Form — last 3 match sessions
  const sorted = [...matchSessions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  const last3 = sorted.slice(0, 3);
  const last3Kicks = last3
    .flatMap((s) => s.kicks)
    .filter((k) => k.kickType === "conversion" || k.kickType === "penalty");
  
  const last3Made = last3Kicks.filter((k) => k.result === "made").length;
  const last3Total = last3Kicks.length;
  const recentForm = last3Total > 0 ? Math.round((last3Made / last3Total) * 100) : 0;

  // 3. Live Streak + Best Streak (Chronological Order)
  // We need to look at kicks from oldest to newest to find the streaks correctly
  const chronologicalMatches = [...sorted].reverse();
  const chronoKicks = chronologicalMatches.flatMap((s) => 
    [...s.kicks]
      .filter((k) => k.kickType === "conversion" || k.kickType === "penalty")
      .sort((a, b) => (a.seq || 0) - (b.seq || 0))
  );

  // Best Streak calculation
  let bestStreak = 0;
  let currentStreak = 0;
  for (const k of chronoKicks) {
    if (k.result === "made") {
      currentStreak++;
      if (currentStreak > bestStreak) bestStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  }

  // Live Streak calculation (counting backwards from the very last kick taken)
  let liveStreak = 0;
  const reversedKicks = [...chronoKicks].reverse();
  for (const k of reversedKicks) {
    if (k.result === "made") {
      liveStreak++;
    } else {
      break; // Stop at the first miss
    }
  }

  // 4. Form trend delta: compare current 3-match window to the previous 3-match window
  let formDelta: number | null = null;
  if (sorted.length >= 2) {
    // Current is 0,1,2. Previous is 1,2,3.
    const prev3 = sorted.slice(1, 4);
    const prev3Kicks = prev3
      .flatMap((s) => s.kicks)
      .filter((k) => k.kickType === "conversion" || k.kickType === "penalty");
    
    const prev3Made = prev3Kicks.filter((k) => k.result === "made").length;
    const prev3Total = prev3Kicks.length;
    const prevForm = prev3Total > 0 ? Math.round((prev3Made / prev3Total) * 100) : 0;
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