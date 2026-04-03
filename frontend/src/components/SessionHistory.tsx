import { useNavigate } from "react-router-dom";
import { usePaginatedSessions, usePerfectShiftId } from "@/hooks/useSessions";
import { Trophy, Loader2, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

interface Session {
  id: string;
  type: string;
  timestamp: string;
  accuracy: number;
  madeCount: number;
  totalCount: number;
  teamName?: string;
}

// Helper to format session dates
const formatSessionDate = (timestamp: string) => {
  try {
    const ts = new Date(timestamp);
    const dateStr = ts.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }).toUpperCase();
    const timeStr = ts.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    return { dateStr, timeStr };
  } catch {
    return { dateStr: "INVALID", timeStr: "00:00" };
  }
};

// Loading skeleton component
const SessionSkeleton = () => (
  <div className="flex items-center justify-between rounded-xl border border-card-border bg-card px-4 py-3">
    <div className="flex items-center gap-3">
      <Skeleton className="h-6 w-12 rounded-md" />
      <div>
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="mt-1 h-3 w-20 rounded" />
      </div>
    </div>
    <div className="text-right">
      <Skeleton className="ml-auto h-6 w-12 rounded" />
      <Skeleton className="mt-1 ml-auto h-3 w-8 rounded" />
    </div>
  </div>
);

// Error state component
const ErrorState = ({ error }: { error: Error | null }) => (
  <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-6 py-8 text-center">
    <AlertCircle className="mx-auto h-8 w-8 text-destructive mb-3" />
    <p className="font-display text-lg font-bold text-foreground">
      Failed to load sessions
    </p>
    <p className="mt-1 text-sm text-muted-foreground">
      {error?.message || "Something went wrong. Please try again."}
    </p>
  </div>
);

// Empty state component
const EmptyState = () => (
  <div className="rounded-xl border border-card-border bg-card px-6 py-8 text-center">
    <p className="font-display text-lg font-bold text-foreground">
      No sessions logged yet
    </p>
    <p className="mt-1 text-sm text-muted-foreground">
      Tap TRAINING or MATCH DAY to start tracking your kicks
    </p>
  </div>
);

// Session card component
interface SessionCardProps {
  session: Session;
  isGoldenBoot: boolean;
  onClick: () => void;
}

const SessionCard = ({ session, isGoldenBoot, onClick }: SessionCardProps) => {
  const { dateStr, timeStr } = formatSessionDate(session.timestamp);
  const isMatch = session.type === "match";
  
  const displayName = isMatch && session.teamName 
    ? `vs ${session.teamName}` 
    : "Technical Drill";

  return (
    <button
      onClick={onClick}
      aria-label={`View ${session.type} session from ${dateStr} with ${session.accuracy}% accuracy`}
      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all duration-300 ${
        isGoldenBoot
          ? "relative border-yellow-500/50 bg-yellow-500/10 shadow-[0_0_20px_rgba(234,179,8,0.3)]"
          : "border-card-border bg-card hover:border-primary/30"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`rounded-md px-2 py-0.5 font-display text-[11px] font-bold tracking-wider ${
          isMatch
            ? "bg-primary/20 text-primary"
            : "bg-training/20 text-training"
        }`}>
          {isMatch ? "MATCH" : "TRAIN"}
        </div>
        <div>
          <p className="font-display text-xs font-bold tracking-wider text-foreground">
            {displayName}
          </p>
          <p className="font-mono text-[11px] text-muted-foreground">
            {dateStr} • {timeStr}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {isGoldenBoot && (
          <div className="flex items-center gap-1 rounded-md bg-yellow-500/20 px-2 py-1">
            <Trophy className="h-3.5 w-3.5 text-yellow-500" />
            <span className="font-display text-[11px] font-bold tracking-wider text-yellow-500">GOLDEN BOOT</span>
          </div>
        )}
        <div className="text-right">
          <p className={`font-display text-lg font-bold ${isGoldenBoot ? 'text-yellow-500' : 'text-primary'}`}>
            {session.accuracy}%
          </p>
          <p className="font-display text-[11px] tracking-wider text-muted-foreground">
            {session.madeCount}/{session.totalCount}
          </p>
        </div>
      </div>
    </button>
  );
};

const SessionHistory = () => {
  const navigate = useNavigate();
  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = usePaginatedSessions();
  const { data: perfectShiftId } = usePerfectShiftId();

  const sessions = useMemo(
    () => data?.pages.flatMap((page) => page) ?? [],
    [data]
  );

  if (isLoading) {
    return (
      <div className="px-4">
        <h2 className="mb-3 font-display text-xs font-semibold tracking-widest text-section-title">
          SESSION HISTORY
        </h2>
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <SessionSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-4">
        <h2 className="mb-3 font-display text-xs font-semibold tracking-widest text-section-title">
          SESSION HISTORY
        </h2>
        <ErrorState error={error as Error | null} />
      </div>
    );
  }

  return (
    <div className="px-4">
      <h2 className="mb-3 font-display text-xs font-semibold tracking-widest text-section-title">
        SESSION HISTORY
      </h2>
      {sessions.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-2">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              isGoldenBoot={session.id === perfectShiftId}
              onClick={() => navigate(`/session/${session.id}`)}
            />
          ))}

          {hasNextPage ? (
            <Button
              variant="ghost"
              className="mt-2 w-full font-display text-xs tracking-wider text-muted-foreground"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "LOAD MORE"
              )}
            </Button>
          ) : sessions.length > 0 ? (
            <p className="mt-2 text-center font-display text-[11px] tracking-wider text-muted-foreground">
              THAT'S EVERYTHING
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SessionHistory;