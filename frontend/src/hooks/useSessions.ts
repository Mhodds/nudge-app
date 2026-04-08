import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSessions,
  getSession,
  getSessionsPaginated,
  saveSession,
  updateSession,
  deleteSession,
  // Note: We removed getPerfectShiftId from here because we are building a better one below!
} from "@/lib/sessions";
import { Session } from "@/types/session";
import { getMatchStats } from "@/lib/stats";
import { queueSession, getPendingSessions } from "@/lib/offlineQueue";

const PAGE_SIZE = 15;

/** Merge cloud sessions with pending offline sessions (dedup, offline wins) */
async function mergeWithPending(cloudSessions: Session[]): Promise<Session[]> {
  const pending = await getPendingSessions();
  if (pending.length === 0) return cloudSessions;

  const pendingIds = new Set(pending.map((s) => s.id));
  const filtered = cloudSessions.filter((s) => !pendingIds.has(s.id));
  // Pending sessions first (newest), then cloud
  const merged = [...pending, ...filtered];
  merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return merged;
}

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const cloud = await getSessions();
      return mergeWithPending(cloud);
    },
  });
}

export function usePaginatedSessions() {
  return useInfiniteQuery({
    queryKey: ["sessions", "paginated"],
    queryFn: ({ pageParam = 0 }) => getSessionsPaginated(pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.length === PAGE_SIZE ? lastPageParam + 1 : undefined,
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ["session", id],
    queryFn: async () => {
      const [cloud, pending] = await Promise.all([
        getSession(id),
        getPendingSessions(),
      ]);
      const queued = pending.find((s) => s.id === id);

      // Prefer whichever source has kick data — cloud can exist with empty kicks
      // if the session row saved but the kicks insert failed
      if (cloud && cloud.kicks.length > 0) return cloud;
      if (queued) return queued;
      return cloud ?? undefined;
    },
    enabled: !!id,
  });
}

// THE "HIJACKED" HOOK: Bulletproof Golden Boot Logic
export function usePerfectShiftId() {
  return useQuery({
    queryKey: ["perfectShift"],
    queryFn: async () => {
      // 1. Fetch all data (Cloud + Offline)
      const cloud = await getSessions();
      const allSessions = await mergeWithPending(cloud);

      // 2. Strict Filter: MUST be a Match, MUST NOT be a drill
      const matchSessions = allSessions.filter(s => {
        const type = String(s.type || '').toLowerCase().trim();
        const name = String(s.teamName || '').toLowerCase();
        
        const isMatch = type === 'match' || type === 'game';
        const isNotTraining = !type.includes('train') && !type.includes('skill') && !name.includes('drill');
        
        return isMatch && isNotTraining;
      });

      if (matchSessions.length === 0) return null;

      // 3. Map Accuracies
      const matchAccuracies = matchSessions.map(s => {
        const placeKicks = s.kicks?.filter(k => k.kickType === 'conversion' || k.kickType === 'penalty') || [];
        const made = placeKicks.filter(k => k.result === 'made').length;
        const acc = placeKicks.length > 0 ? (made / placeKicks.length) : 0;
        return { id: s.id, acc, volume: placeKicks.length };
      });

      // 4. Find the Undisputed Winner (Highest Accuracy, tie-breaker is Volume)
      const bestMatch = matchAccuracies.reduce((best, current) => {
        if (!best || current.acc > best.acc) return current;
        if (current.acc === best.acc && current.volume > best.volume) return current;
        return best;
      }, null as any);

      return bestMatch && bestMatch.acc > 0 ? bestMatch.id : null;
    },
  });
}

export function useMatchStats() {
  const { data: sessions = [] } = useSessions();
  return getMatchStats(sessions);
}

export function useSaveSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (session: Session) => {
      if (!navigator.onLine) {
        await queueSession(session);
        return;
      }
      try {
        await saveSession(session);
      } catch {
        // Network failed mid-request — queue for later
        await queueSession(session);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["perfectShift"] });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (session: Session) => updateSession(session),
    onSuccess: (_data, session) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["session", session.id] });
      queryClient.invalidateQueries({ queryKey: ["perfectShift"] });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["perfectShift"] });
    },
  });
}