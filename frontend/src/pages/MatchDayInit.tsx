import { useState } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MatchDayInit = () => {
  const navigate = useNavigate();
  const [teamName, setTeamName] = useState("");
  const [matchDate, setMatchDate] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-card-border bg-card p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <h2 className="font-display text-xl font-black italic tracking-wider text-primary">
            INITIALIZE MATCH
          </h2>
          <button
            onClick={() => navigate("/")}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Opponent Identity */}
        <div className="mb-5">
          <label className="mb-2 block font-display text-xs font-semibold tracking-widest text-muted-foreground">
            OPPONENT IDENTITY
          </label>
          <input
            type="text"
            placeholder="ENTER TEAM NAME..."
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="w-full rounded-xl border border-card-border bg-secondary px-4 py-3 font-display text-sm font-bold tracking-wider text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Match Date */}
        <div className="mb-6">
          <label className="mb-2 block font-display text-xs font-semibold tracking-widest text-muted-foreground">
            MATCH DATE
          </label>
          <input
            type="date"
            value={matchDate}
            onChange={(e) => setMatchDate(e.target.value)}
            className="w-full rounded-xl border border-card-border bg-secondary px-4 py-3 font-display text-sm font-bold tracking-wider text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary [color-scheme:dark]"
          />
        </div>

        {/* Engage Button */}
        <button
          disabled={!teamName.trim() || !matchDate}
          onClick={() => navigate("/match-day/track", { state: { teamName: teamName.trim(), matchDate } })}
          className={`w-full rounded-xl py-4 font-display text-sm font-black tracking-widest shadow-lg transition-opacity ${
            teamName.trim() && matchDate
              ? "bg-primary text-primary-foreground shadow-primary/30 hover:opacity-90"
              : "cursor-not-allowed bg-primary/30 text-primary-foreground/50 shadow-none"
          }`}
        >
          ENGAGE TRACKER
        </button>
      </div>
    </div>
  );
};

export default MatchDayInit;
