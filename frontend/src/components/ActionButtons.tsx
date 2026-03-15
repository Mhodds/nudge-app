import { Target, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ActionButtons = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      <button onClick={() => navigate("/training")} className="flex flex-col items-center justify-center gap-2 rounded-xl bg-training py-5 font-display text-sm font-bold tracking-wider text-accent-foreground shadow-lg">
        <Target className="h-8 w-8" />
        TRAINING
      </button>
      <button onClick={() => navigate("/match-day")} className="flex flex-col items-center justify-center gap-2 rounded-xl bg-matchday py-5 font-display text-sm font-bold tracking-wider text-primary-foreground shadow-lg">
        <Trophy className="h-8 w-8" />
        MATCH DAY
      </button>
    </div>
  );
};

export default ActionButtons;
