import { useEffect, useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { saveSession } from "@/lib/sessions";
import {
  getPendingSessions,
  removePendingSession,
  getPendingCount,
} from "@/lib/offlineQueue";

const RETRY_INTERVAL_MS = 30_000;

export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return online;
}

export function useOfflineSync() {
  const online = useOnlineStatus();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);

  const refreshCount = useCallback(async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  }, []);

  const syncPending = useCallback(async () => {
    // Prevent concurrent syncs
    if (syncingRef.current) return;
    const pending = await getPendingSessions();
    if (pending.length === 0) return;

    syncingRef.current = true;
    setSyncing(true);
    let synced = 0;

    for (const session of pending) {
      try {
        await saveSession(session);
        await removePendingSession(session.id);
        synced++;
      } catch {
        break;
      }
    }

    if (synced > 0) {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["perfectShift"] });
      toast({
        title: "Sessions synced",
        description: `${synced} offline session(s) uploaded to the cloud.`,
      });
    }

    await refreshCount();
    setSyncing(false);
    syncingRef.current = false;
  }, [queryClient, toast, refreshCount]);

  // Sync when coming back online
  useEffect(() => {
    if (online) {
      syncPending();
    }
  }, [online, syncPending]);

  // Periodic retry every 30s when there are pending sessions
  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine) {
        syncPending();
      }
    }, RETRY_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [syncPending]);

  // Refresh count on mount
  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  return { online, pendingCount, syncing, refreshCount, syncPending };
}
