import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const SubmitOverlay = ({ onComplete }: { onComplete?: () => void }) => {
  const navigate = useNavigate();
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onCompleteRef.current) onCompleteRef.current();
      else navigate("/");
    }, 450);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="fixed inset-0 z-50 animate-[wipe-down_0.4s_ease-in-out_forwards] bg-background" />
  );
};

export default SubmitOverlay;
