import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SubmitOverlay = ({ onComplete }: { onComplete?: () => void }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
      else navigate("/");
    }, 450);
    return () => clearTimeout(timer);
  }, [navigate, onComplete]);

  return (
    <div className="fixed inset-0 z-50 animate-[wipe-down_0.4s_ease-in-out_forwards] bg-background" />
  );
};

export default SubmitOverlay;
