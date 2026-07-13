"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { getTheme, setTheme } from "@/lib/theme";

interface ThemeToggleProps {
  onThemeChange?: (theme: "light" | "dark") => void;
}

export function ThemeToggle({ onThemeChange }: ThemeToggleProps) {
  const [theme, setInternalTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const current = getTheme();
    setInternalTheme(current);
    if (onThemeChange) {
      onThemeChange(current);
    }
  }, [onThemeChange]);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    setInternalTheme(next);
    if (onThemeChange) {
      onThemeChange(next);
    }
  };

  return (
    <button onClick={toggle} type="button" aria-label="Toggle theme">
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
