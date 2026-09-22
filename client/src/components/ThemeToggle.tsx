import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme } = useTheme();
  const [dark, setDark] = useState(theme === "dark");

  useEffect(() => {
    setDark(theme === "dark");
  }, [theme]);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Activar modo claro" : "Activar modo oscuro"}
      title={dark ? "Modo claro" : "Modo oscuro"}
      className={`grid place-items-center rounded-full border border-[#d8e1d5] bg-white text-[#385743] shadow-sm transition hover:border-[#92a992] active:scale-95 ${compact ? "h-9 w-9" : "h-10 w-10"}`}
    >
      {dark ? <Sun className={compact ? "h-4 w-4" : "h-4.5 w-4.5"} /> : <Moon className={compact ? "h-4 w-4" : "h-4.5 w-4.5"} />}
    </button>
  );
}
