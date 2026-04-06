import { useRef, useState } from "react";
import { Download, Upload, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSessions } from "@/hooks/useSessions";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Session, Kick } from "@/types/session";

const DataActions = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showWipeModal, setShowWipeModal] = useState(false);
  const { toast } = useToast();
  const { data: sessions = [] } = useSessions();
  const queryClient = useQueryClient();

  const handleExport = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      sessions,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ruck_kick_backup.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Backup exported", description: `${sessions.length} session(s) saved to file.` });
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        const importedSessions: Session[] = parsed.sessions;
        if (!Array.isArray(importedSessions)) throw new Error("Invalid backup");

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Fetch existing sessions to check for duplicates
        const { data: existingSessions } = await supabase
          .from("sessions")
          .select("id, timestamp, type")
          .eq("user_id", user.id);

        const existingSessionIds = new Set(existingSessions?.map(s => s.id) || []);
        let skippedCount = 0;
        let importedCount = 0;

        for (const session of importedSessions) {
          // Skip if session already exists
          if (existingSessionIds.has(session.id)) {
            skippedCount++;
            continue;
          }

          // Insert new session with generated ID
          const { data: newSession } = await supabase
            .from("sessions")
            .insert({
              user_id: user.id,
              type: session.type,
              timestamp: session.timestamp,
              team_name: session.teamName || null,
              made_count: session.madeCount,
              total_count: session.totalCount,
              accuracy: session.accuracy,
              avg_feel: session.avgFeel,
            })
            .select()
            .single();

          if (newSession && session.kicks.length > 0) {
            await supabase.from("kicks").insert(
              session.kicks.map((k: Kick) => ({
                session_id: newSession.id,
                seq: k.seq,
                result: k.result,
                kick_type: k.kickType || null,
                distance: k.distance,
                angle: k.angle,
                wind: k.wind || null,
                technical_miss: k.technicalMiss || null,
                feel: k.feel || null,
              }))
            );
          }

          importedCount++;
        }

        queryClient.invalidateQueries({ queryKey: ["sessions"] });
        queryClient.invalidateQueries({ queryKey: ["perfectShift"] });

        let message = `${importedCount} session(s) imported.`;
        if (skippedCount > 0) {
          message += ` ${skippedCount} duplicate(s) skipped.`;
        }
        toast({ title: "Data restored", description: message });
      } catch {
        toast({ title: "Restore failed", description: "Invalid backup file.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleWipe = async () => {
    // Delete all user's sessions (kicks cascade)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("sessions").delete().eq("user_id", user.id);
    }
    setShowWipeModal(false);
    queryClient.invalidateQueries({ queryKey: ["sessions"] });
    queryClient.invalidateQueries({ queryKey: ["perfectShift"] });
    toast({ title: "Database wiped", description: "All data has been destroyed." });
  };

  return (
    <div className="px-4">
      <div className="mb-4 border-t border-card-border" />
      <h2 className="mb-3 font-display text-xs font-semibold tracking-widest text-section-title">
        MAINTENANCE VAULT
      </h2>
      <div className="flex gap-3">
        <button onClick={handleExport} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-card-border bg-card py-3 font-display text-xs font-bold tracking-wider text-foreground transition-colors hover:border-success/40">
          <Download className="h-4 w-4 text-success" />
          DATA BACKUP
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-card-border bg-card py-3 font-display text-xs font-bold tracking-wider text-foreground transition-colors hover:border-primary/40">
          <Upload className="h-4 w-4 text-primary" />
          RESTORE LOCAL
        </button>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleRestore} className="hidden" />
      </div>
      <button onClick={() => setShowWipeModal(true)} className="mt-5 w-full text-center font-display text-sm font-black italic tracking-wider text-accent">
        WIPE DATABASE & MASTER RESET
      </button>
      {showWipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="mx-6 w-full max-w-sm rounded-2xl border border-card-border bg-card p-6 shadow-2xl animate-scale-in">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/20">
                <AlertTriangle className="h-7 w-7 text-accent" />
              </div>
              <h3 className="font-display text-lg font-black italic tracking-wider text-foreground">DESTROY ALL DATA?</h3>
              <p className="text-sm text-muted-foreground">This will permanently delete every session, kick, and statistic. This action cannot be undone.</p>
              <div className="mt-2 flex w-full gap-3">
                <button onClick={() => setShowWipeModal(false)} className="flex-1 rounded-xl border border-card-border bg-secondary py-3 font-display text-xs font-bold tracking-wider text-foreground transition-colors hover:bg-secondary/80">CANCEL</button>
                <button onClick={handleWipe} className="flex-1 rounded-xl bg-accent py-3 font-display text-xs font-bold tracking-wider text-accent-foreground transition-colors hover:bg-accent/90">CONFIRM</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataActions;