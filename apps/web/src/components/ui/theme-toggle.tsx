"use client";

import { useTheme } from "@/lib/theme";
import { MoonIcon, SunIcon } from "./icons";

/** ThemeToggle. `onChange` lets signed-in screens also store profiles.theme. */
export function ThemeToggle({ height = 48, onChange }: { height?: 40 | 48; onChange?: (t: "dark" | "light") => void }) {
  const { theme, setTheme } = useTheme();
  const next = theme === "light" ? "dark" : "light";
  const aria = next === "light" ? "Switch to light mode" : "Switch to dark mode";
  return (
    <button
      type="button"
      onClick={() => {
        setTheme(next);
        onChange?.(next);
      }}
      aria-label={aria}
      title={aria}
      className="flex cursor-pointer items-center gap-2 rounded-btn border border-chip bg-inset px-3.5 font-[inherit] text-sm font-semibold text-ink"
      style={{ height }}
    >
      {theme === "light" ? <MoonIcon size={18} /> : <SunIcon size={18} />}
      {theme === "light" ? "Dark" : "Light"}
    </button>
  );
}
