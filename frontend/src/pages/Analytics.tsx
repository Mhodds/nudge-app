import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, BarChart3 } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import VelocityGraph from "@/components/VelocityGraph";
import EfficiencyMatrix from "@/components/EfficiencyMatrix";
import MetricAudit from "@/components/MetricAudit";
import { useSessions } from "@/hooks/useSessions";
import { Skeleton } from "@/components/ui/skeleton";

const Analytics = () => {
  const navigate = useNavigate();
  const [dataTab, setDataTab] = useState<"aggregated" | "match" | "skill">("aggregated");
  const { data: sessions = [], isLoading } = useSessions();

  const hasData = sessions.length > 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="flex items-center justify-center px-4 pt-6 pb-4">
          <button
            onClick={() => navigate("/")}
            className="absolute left-4 text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-xl font-black italic tracking-wider">
            <span className="text-foreground">DATA </span>
            <span className="text-primary">AUDIT</span>
          </h1>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-6 px-4">
            <Skeleton className="h-52 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center px-6 py-24">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mb-2 font-display text-sm font-black italic tracking-wider text-foreground">
              NO DATA YET
            </h2>
            <p className="max-w-xs text-center font-display text-xs font-semibold tracking-wider text-muted-foreground">
              LOG YOUR FIRST SESSION TO UNLOCK THE FULL DATA AUDIT — VELOCITY, EFFICIENCY MATRIX & METRIC BREAKDOWN
            </p>
            <button
              onClick={() => navigate("/")}
              className="mt-6 rounded-xl bg-primary px-6 py-3 font-display text-xs font-bold tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
            >
              START A SESSION
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6 px-4">
            {/* Match Performance Velocity */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-sm font-black italic tracking-wider text-foreground">
                  MATCH PERFORMANCE VELOCITY
                </h2>
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <VelocityGraph />
            </div>

            {/* Efficiency Matrix */}
            <div>
              <div className="mb-3">
                <h2 className="font-display text-sm font-black italic tracking-wider text-foreground">
                  EFFICIENCY MATRIX
                </h2>
              </div>
              <EfficiencyMatrix filter={dataTab} />

              {/* Data Tab Selector */}
              <div className="mt-4 flex rounded-lg bg-secondary p-1">
                <button
                  onClick={() => setDataTab("aggregated")}
                  className={`flex-1 rounded-md py-2 font-display text-xs font-bold tracking-wider transition-colors ${
                    dataTab === "aggregated"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground"
                  }`}
                >
                  Aggregated
                </button>
                <button
                  onClick={() => setDataTab("match")}
                  className={`flex-1 rounded-md py-2 font-display text-xs font-bold tracking-wider transition-colors ${
                    dataTab === "match"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground"
                  }`}
                >
                  Match Play
                </button>
                <button
                  onClick={() => setDataTab("skill")}
                  className={`flex-1 rounded-md py-2 font-display text-xs font-bold tracking-wider transition-colors ${
                    dataTab === "skill"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground"
                  }`}
                >
                  Training
                </button>
              </div>
            </div>

            {/* Metric Audit */}
            <div>
              <h2 className="mb-3 font-display text-sm font-black italic tracking-wider text-foreground">
                METRIC AUDIT
              </h2>
              <MetricAudit />
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Analytics;
