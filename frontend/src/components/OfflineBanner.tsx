import { WifiOff, CloudUpload, Loader2 } from "lucide-react";

interface OfflineBannerProps {
  online: boolean;
  pendingCount: number;
  syncing: boolean;
}

const OfflineBanner = ({ online, pendingCount, syncing }: OfflineBannerProps) => {
  if (online && pendingCount === 0) return null;

  return (
    <div className="mx-4 mb-3 flex items-center gap-2 rounded-xl border border-card-border bg-card px-4 py-2.5">
      {!online ? (
        <>
          <WifiOff className="h-4 w-4 shrink-0 text-accent" />
          <span className="font-display text-xs font-semibold tracking-wider text-accent">
            OFFLINE MODE
            {pendingCount > 0 && (
              <span className="ml-1 text-muted-foreground">
                · {pendingCount} pending
              </span>
            )}
          </span>
        </>
      ) : syncing ? (
        <>
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
          <span className="font-display text-xs font-semibold tracking-wider text-primary">
            SYNCING…
          </span>
        </>
      ) : (
        <>
          <CloudUpload className="h-4 w-4 shrink-0 text-primary" />
          <span className="font-display text-xs font-semibold tracking-wider text-muted-foreground">
            {pendingCount} session(s) waiting to sync
          </span>
        </>
      )}
    </div>
  );
};

export default OfflineBanner;
