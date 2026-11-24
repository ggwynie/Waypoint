"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Theme } from "./api/types";

const KEY = "wp-theme";
const ThemeCtx = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({ theme: "dark", setTheme: () => {} });

const LIGHT_QUERY = "(prefers-color-scheme: light)";

/** Inline script for <head>, run before first paint:
 *  a stored choice wins; otherwise follow the system; dark when neither is known. */
export const themeBootScript = `(function(){var d=document.documentElement,t=null;try{t=localStorage.getItem("${KEY}")}catch(e){}if(t!=="light"&&t!=="dark"){try{t=window.matchMedia&&window.matchMedia("${LIGHT_QUERY}").matches?"light":"dark"}catch(e){t="dark"}}d.dataset.theme=t})();`;

function storedTheme(): Theme | null {
  try {
    const t = localStorage.getItem(KEY);
    return t === "light" || t === "dark" ? t : null;
  } catch {
    return null;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setState] = useState<Theme>("dark");
  useEffect(() => {
    setState(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    // Until the person picks a theme, keep following the system when it changes.
    const mq = window.matchMedia?.(LIGHT_QUERY);
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent) => {
      if (storedTheme()) return;
      const t: Theme = e.matches ? "light" : "dark";
      document.documentElement.dataset.theme = t;
      setState(t);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const setTheme = useCallback((t: Theme) => {
    setState(t);
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem(KEY, t);
    } catch {
      /* private mode: theme lasts for this page view */
    }
  }, []);
  return <ThemeCtx.Provider value={{ theme, setTheme }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
