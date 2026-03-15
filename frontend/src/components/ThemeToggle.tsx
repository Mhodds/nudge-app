import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  // We default to true because NUDGE was born in the dark mode vibe
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // When the app loads, check if the user previously chose light mode
    const savedTheme = localStorage.getItem("nudge-theme");
    
    if (savedTheme === "light") {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    } else {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("nudge-theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("nudge-theme", "dark");
      setIsDark(true);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="rounded-xl border border-card-border bg-card p-2.5 text-muted-foreground transition-colors hover:text-foreground"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="h-4 w-4" /> // Show Sun icon to switch to Light Mode
      ) : (
        <Moon className="h-4 w-4" /> // Show Moon icon to switch to Dark Mode
      )}
    </button>
  );
}