import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSessions,
  getSession,
  getSessionsPaginated,
  saveSession,
  updateSession,
  deleteSession,
  getPerfectShiftId,
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
      // Try cloud first
      const cloud = await getSession(id);
      if (cloud) return cloud;
      // Fall back to offline queue
      const pending = await getPendingSessions();
      return pending.find((s) => s.id === id) ?? undefined;
    },
    enabled: !!id,
  });
}

export function usePerfectShiftId() {
  return useQuery({
    queryKey: ["perfectShift"],
    queryFn: getPerfectShiftId,
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
