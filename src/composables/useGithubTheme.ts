import { createLogger } from "@/utils/logger";
import { ref, onUnmounted } from "vue";

const logger = createLogger("useGitHubTheme");
const currentTheme = ref<"light" | "dark">("light");

// Helper to check GitHub's actual current state
export function getGitHubTheme(): "light" | "dark" {
  const mode = document.documentElement.getAttribute("data-color-mode");
  return mode === "dark" ? "dark" : "light";
}

export function useGitHubTheme() {
  const applyThemeToDocument = (theme: "light" | "dark"): void => {
    document.documentElement.classList.remove("theme-light", "theme-dark");
    document.documentElement.classList.add(`theme-${theme}`);
    currentTheme.value = theme;
  };

  const loadAndWatch = async () => {
    // Initial Load
    const result = await browser.storage.local.get("githubTheme");
    const theme =
      result.githubTheme === "dark" || result.githubTheme === "light"
        ? result.githubTheme
        : getGitHubTheme();

    applyThemeToDocument(theme);

    // Listen for storage changes (Sync across UI)
    const listener = (changes: any, namespace: string) => {
      if (namespace === "local" && changes.githubTheme) {
        logger.debug(`Theme updated to: ${changes.githubTheme.newValue}`);
        applyThemeToDocument(changes.githubTheme.newValue);
      }
    };

    browser.storage.onChanged.addListener(listener);

    // Cleanup if used in a component
    onUnmounted(() => {
      browser.storage.onChanged.removeListener(listener);
    });
  };

  return {
    currentTheme,
    loadAndWatch,
  };
}
