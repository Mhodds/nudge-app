import { LayoutDashboard, BarChart3 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAnalytics = location.pathname.startsWith("/analytics");

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-card-border bg-bottom-nav/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-md">
        <button
          onClick={() => navigate("/")}
          className={`flex flex-1 flex-col items-center gap-1 py-3 font-display text-xs font-bold tracking-wider transition-colors ${
            !isAnalytics ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
          DASHBOARD
        </button>
        <button
          onClick={() => navigate("/analytics")}
          className={`flex flex-1 flex-col items-center gap-1 py-3 font-display text-xs font-bold tracking-wider transition-colors ${
            isAnalytics ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <BarChart3 className="h-5 w-5" />
          ANALYTICS
        </button>
      </div>
    </div>
  );
};

export default BottomNav;