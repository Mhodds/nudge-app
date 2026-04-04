import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  // Read saved preference immediately to avoid a flash on load
  const [isDark, setIsDark] = useState(() => localStorage.getItem("nudge-theme") !== "light");

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

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