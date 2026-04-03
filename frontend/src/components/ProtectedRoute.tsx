import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const LoadingSpinner = () => (
  <div 
    role="status" 
    aria-live="polite"
    className="flex min-h-screen items-center justify-center bg-background"
  >
    <div className="font-display text-sm tracking-widest text-muted-foreground animate-pulse">
      LOADING…
    </div>
  </div>
);

const ProtectedRoute = ({ 
  children, 
  redirectTo = "/auth" 
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <Navigate 
        to={redirectTo} 
        replace 
        state={{ from: location.pathname }} 
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;