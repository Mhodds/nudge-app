import { Session, Kick } from "@/types/session";

export function getMatchStats(sessions: Session[]) {
  const matchSessions = sessions.filter((s) => s.type === "match");

  // 1. Season Acc
  const allKicks = matchSessions.flatMap((s) => s.kicks).filter((k) => k.kickType !== "try" && k.kickType !== "drop_goal");
  const totalMade = allKicks.filter((k) => k.result === "made").length;
  const totalKicks = allKicks.length;
  const seasonAcc = totalKicks > 0 ? Math.round((totalMade / totalKicks) * 100) : 0;

  // 2. Recent Form — last 3 match sessions
  const sorted = [...matchSessions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const last3 = sorted.slice(0, 3);
  const last3Kicks = last3.flatMap((s) => s.kicks).filter((k) => k.kickType !== "try" && k.kickType !== "drop_goal");
  const last3Made = last3Kicks.filter((k) => k.result === "made").length;
  const last3Total = last3Kicks.length;
  const recentForm = last3Total > 0 ? Math.round((last3Made / last3Total) * 100) : 0;

  // 3. Live Streak + Best Streak
  const chronoKicks: Kick[] = sorted.flatMap((s) =>
    [...s.kicks].filter((k) => k.kickType !== "try" && k.kickType !== "drop_goal").sort((a, b) => b.seq - a.seq)
  );

  let liveStreak = 0;
  for (const k of chronoKicks) {
    if (k.result === "made") liveStreak++;
    else break;
  }

  const allChronoOldest: Kick[] = [...sorted]
    .reverse()
    .flatMap((s) => [...s.kicks].filter((k) => k.kickType !== "try" && k.kickType !== "drop_goal").sort((a, b) => a.seq - b.seq));
  let bestStreak = 0;
  let current = 0;
  for (const k of allChronoOldest) {
    if (k.result === "made") {
      current++;
      if (current > bestStreak) bestStreak = current;
    } else {
      current = 0;
    }
  }

  // Form trend delta: compare current 3-match rolling avg to previous
  let formDelta: number | null = null;
  if (sorted.length >= 2) {
    const prev3 = sorted.slice(1, 4);
    const prev3Kicks = prev3.flatMap((s) => s.kicks).filter((k) => k.kickType !== "try" && k.kickType !== "drop_goal");
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
