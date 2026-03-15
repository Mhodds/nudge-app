import { useNavigate } from "react-router-dom";
import { usePaginatedSessions, usePerfectShiftId } from "@/hooks/useSessions";
import { Trophy, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const SessionHistory = () => {
  const navigate = useNavigate();
  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = usePaginatedSessions();
  const { data: perfectShiftId } = usePerfectShiftId();

  const sessions = data?.pages.flatMap((page) => page) ?? [];

  if (isLoading) {
    return (
      <div className="px-4">
        <h2 className="mb-3 font-display text-xs font-semibold tracking-widest text-section-title">
          SESSION HISTORY
        </h2>
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-card-border bg-card px-4 py-3">
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
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4">
      <h2 className="mb-3 font-display text-xs font-semibold tracking-widest text-section-title">
        SESSION HISTORY
      </h2>
      {sessions.length === 0 ? (
        <div className="rounded-xl border border-card-border bg-card px-6 py-8 text-center">
          <p className="font-display text-lg font-bold text-foreground">
            No sessions logged yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap TRAINING or MATCH DAY to start tracking your kicks
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sessions.map((session) => {
            const ts = new Date(session.timestamp);
            const dateStr = ts.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }).toUpperCase();
            const timeStr = ts.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
            return (
              <button
                key={session.id}
                onClick={() => navigate(`/session/${session.id}`)}
                className="flex items-center justify-between rounded-xl border border-card-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/30"
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-md px-2 py-0.5 font-display text-[11px] font-bold tracking-wider ${
                    session.type === "match"
                      ? "bg-primary/20 text-primary"
                      : "bg-training/20 text-training"
                  }`}>
                    {session.type === "match" ? "MATCH" : "TRAIN"}
                  </div>
                  <div>
                    <p className="font-display text-xs font-bold tracking-wider text-foreground">
                      {session.type === "match" && session.teamName
                        ? `vs ${session.teamName}`
                        : "Technical Drill"}
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {dateStr} • {timeStr}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {session.id === perfectShiftId && (
                    <div className="flex items-center gap-1 rounded-md bg-yellow-500/20 px-2 py-1">
                      <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                      <span className="font-display text-[11px] font-bold tracking-wider text-yellow-500">GOLDEN BOOT</span>
                    </div>
                  )}
                  <div className="text-right">
                    <p className="font-display text-lg font-bold text-primary">{session.accuracy}%</p>
                    <p className="font-display text-[11px] tracking-wider text-muted-foreground">
                      {session.madeCount}/{session.totalCount}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}

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
