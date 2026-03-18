import { useEffect, useState } from "react";
import ActionButtons from "@/components/ActionButtons";
import StatsCards from "@/components/StatsCards";
import InterfaceMode from "@/components/InterfaceMode";
import SessionHistory from "@/components/SessionHistory";
import DataActions from "@/components/DataActions";
import BottomNav from "@/components/BottomNav";
import ThemeToggle from "@/components/ThemeToggle";
import { migrateLocalStorageToCloud } from "@/lib/sessions";
import { useQueryClient, useIsFetching } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useSessions } from "@/hooks/useSessions";
import { LogOut, RefreshCw, Target } from "lucide-react";
import OfflineBanner from "@/components/OfflineBanner";
import { useOfflineSync } from "@/hooks/useOfflineSync";

const RefreshButton = ({ onSync }: { onSync: () => void }) => {
  const queryClient = useQueryClient();
  const isFetching = useIsFetching();

  const handleRefresh = () => {
    onSync();
    queryClient.invalidateQueries();
  };

  return (
    <button
      onClick={handleRefresh}
      className="rounded-xl border border-card-border bg-card p-2.5 text-muted-foreground transition-colors hover:text-foreground"
      aria-label="Refresh data"
    >
      <RefreshCw className={`h-4 w-4 transition-transform ${isFetching ? "animate-spin" : ""}`} />
    </button>
  );
};

const Index = () => {
  const [migrated, setMigrated] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { online, pendingCount, syncing, syncPending } = useOfflineSync();
  
  // --- TRAINING GOAL LOGIC ---
  const { data: sessions } = useSessions();
  const trainingKicks = sessions?.filter(s => s.type === 'training')
    .reduce((sum, s) => sum + (s.kicks?.length || 0), 0) || 0;

  const GOAL = 500;
  const percent = Math.min(Math.round((trainingKicks / GOAL) * 100), 100);
  const remaining = Math.max(0, GOAL - trainingKicks);

  useEffect(() => {
    if (!user || migrated) return;
    const MIGRATION_KEY = "ruck-kick-migrated";
    if (localStorage.getItem(MIGRATION_KEY)) return;

    migrateLocalStorageToCloud().then((count) => {
      if (count > 0) {
        localStorage.setItem(MIGRATION_KEY, "true");
        queryClient.invalidateQueries({ queryKey: ["sessions"] });
        toast({
          title: "Data migrated",
          description: `${count} session(s) moved to the cloud.`,
        });
      }
      setMigrated(true);
    });
  }, [user, migrated, queryClient, toast]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-md">
        
        {/* BRANDED HEADER */}
        <div className="flex items-start justify-between px-4 pt-8 pb-4">
          <div className="flex flex-col items-start text-left">
            <h1 className="font-display text-3xl font-black italic tracking-tighter uppercase leading-none text-foreground">
              Nudge <span className="text-primary">Check</span>
            </h1>
            <p className="font-display text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mt-1.5">
              Kicking Performance Lab
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <RefreshButton onSync={syncPending} />
            <ThemeToggle />
            <button
              onClick={signOut}
              className="rounded-xl border border-card-border bg-card p-2.5 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Offline Banner */}
        <OfflineBanner online={online} pendingCount={pendingCount} syncing={syncing} />

        {/* Main Content Stack */}
        <div className="flex flex-col gap-5 px-4">
          
          <StatsCards />

          {/* COMPACT TRAINING GOAL TRACKER (Bigger Text Version) */}
          <div className="rounded-xl border border-card-border bg-card/50 p-5 shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <h3 className="font-display text-[11px] font-black italic tracking-[0.15em] text-primary uppercase">
                    TRAINING GOAL: 500 REPS
                  </h3>
                </div>
                {/* BIGGER REP COUNT */}
                <p className="font-display text-lg font-black text-foreground">
                  {trainingKicks} <span className="text-xs font-bold text-muted-foreground italic">/ {GOAL}</span>
                </p>
              </div>

              {/* SLIM PROGRESS BAR */}
              <div className="relative h-2 w-full rounded-full bg-secondary border border-card-border">
                <div 
                  className="absolute left-0 top-0 h-full rounded-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(var(--primary),0.4)]"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between">
                {/* BIGGER FOOTER TEXT */}
                <p className="font-body text-[10px] font-bold text-muted-foreground tracking-widest uppercase italic">
                  {remaining > 0 ? `${remaining} REPS TO TARGET` : "TARGET ACHIEVED"}
                </p>
                <p className="font-display text-xs font-black text-primary italic">
                  {percent}%
                </p>
              </div>
            </div>
          </div>

          <ActionButtons />
          <InterfaceMode />
          <SessionHistory />
          <DataActions />
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Index;