import { create } from "zustand";

type Theme = "dark" | "light";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const applyTheme = (t: Theme) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (t === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
    root.setAttribute("data-theme", "dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.add("light");
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
    root.style.colorScheme = "light";
  }
};

export const useThemeStore = create<ThemeState>()((set, get) => ({
  theme: "dark",

  setTheme: (newTheme: Theme) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("littlelyst-theme", newTheme);
    }
    applyTheme(newTheme);
    set({ theme: newTheme });
  },

  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },
}));

/** Call once on client mount to hydrate theme from localStorage */
export function initTheme() {
  if (typeof localStorage === "undefined") return;
  const saved = localStorage.getItem("littlelyst-theme") as Theme | null;
  const resolved: Theme = saved === "light" ? "light" : "dark";
  applyTheme(resolved);
  useThemeStore.setState({ theme: resolved });
}
