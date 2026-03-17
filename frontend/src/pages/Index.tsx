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
import { LogOut, RefreshCw } from "lucide-react";
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
        
        {/* BRANDED HEADER (TOP LEFT) */}
        <div className="flex items-start justify-between px-4 pt-8 pb-4">
          <div className="flex flex-col items-start text-left">
            <h1 className="font-display text-3xl font-black italic tracking-tighter uppercase leading-none">
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

        {/* Main Content */}
        <div className="flex flex-col gap-5">
          <StatsCards />
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