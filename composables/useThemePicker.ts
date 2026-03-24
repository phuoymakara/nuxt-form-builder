const STORAGE_KEY = "esb-theme";

export const primaryColors = [
  "red", "orange", "amber", "yellow", "lime", "green",
  "emerald", "teal", "cyan", "sky", "blue", "indigo",
  "violet", "purple", "fuchsia", "pink", "rose",
];

export const neutralColors = ["slate", "gray", "zinc", "neutral", "stone"];

export const colorMap: Record<string, string> = {
  red: "#ef4444", orange: "#f97316", amber: "#f59e0b", yellow: "#eab308",
  lime: "#84cc16", green: "#22c55e", emerald: "#10b981", teal: "#14b8a6",
  cyan: "#06b6d4", sky: "#0ea5e9", blue: "#3b82f6", indigo: "#6366f1",
  violet: "#8b5cf6", purple: "#a855f7", fuchsia: "#d946ef", pink: "#ec4899",
  rose: "#f43f5e",
  slate: "#64748b", gray: "#6b7280", zinc: "#71717a", neutral: "#737373", stone: "#78716c",
};

export function useThemePicker() {
  const appConfig = useAppConfig();
  const showThemePicker = ref(false);

  function loadTheme() {
    if (import.meta.client) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const { primary, neutral } = JSON.parse(saved);
          if (primary) appConfig.ui.colors.primary = primary;
          if (neutral) appConfig.ui.colors.neutral = neutral;
        } catch {}
      }
    }
  }

  function saveTheme() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      primary: appConfig.ui.colors.primary,
      neutral: appConfig.ui.colors.neutral,
    }));
  }

  function setPrimary(color: string) {
    appConfig.ui.colors.primary = color;
    saveTheme();
  }

  function setNeutral(color: string) {
    appConfig.ui.colors.neutral = color;
    saveTheme();
  }

  onMounted(loadTheme);

  return {
    appConfig,
    showThemePicker,
    setPrimary,
    setNeutral,
  };
}
