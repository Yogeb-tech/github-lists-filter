import ListsView from "@/components/ListsView.vue";
import { createLogger } from "@/utils/logger";
import { createApp } from "vue";
import { createIntegratedUi } from "wxt/utils/content-script-ui/integrated";
import { defineContentScript } from "wxt/utils/define-content-script";
import "./popup/style.css";
import { getGitHubTheme, useGitHubTheme } from "@/composables/useGithubTheme";

const logger = createLogger("content.ts");

export default defineContentScript({
  matches: ["https://github.com/"],
  async main(ctx) {
    logger.debug("Content script started");

    /* --- THEME SYNC LOGIC --- */
    // Sync GitHub's current theme to storage immediately
    await browser.storage.local.set({ githubTheme: getGitHubTheme() });

    // Watch GitHub's <html> tag for theme attribute changes
    const themeObserver = new MutationObserver(() => {
      const newTheme = getGitHubTheme();
      browser.storage.local.set({ githubTheme: newTheme });
    });

    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-color-mode"],
    });

    /* --- FILTERING LOGIC --- */
    let allowedRepos: string[] = [];

    const getFeedContainer = () => {
      const selectors = [
        "#conduit-feed-frame",
        "feed-container",
        ".js-for-you-feed-items",
      ];
      return selectors
        .map((s) => document.querySelector(s))
        .find((el) => el !== null);
    };

    const getRepoNameFromItem = (item: Element): string | null => {
      const link = item.querySelector('a[data-hovercard-type="repository"]');
      return link
        ? (link as HTMLElement).innerText.replace(/\s+/g, "").trim()
        : null;
    };

    const applyFilter = () => {
      const feed = getFeedContainer();
      if (!feed) return;

      const items = feed.querySelectorAll("article.js-feed-item-component");
      items.forEach((item) => {
        const htmlElement = item as HTMLElement;
        const repoName = getRepoNameFromItem(item);

        if (
          allowedRepos.length > 0 &&
          repoName &&
          !allowedRepos.includes(repoName)
        ) {
          htmlElement.style.setProperty("display", "none", "important");
        } else {
          htmlElement.style.setProperty("display", "", "important");
        }
      });
    };

    window.addEventListener("github-filter-changed", (e: any) => {
      allowedRepos = e.detail.repos || [];
      applyFilter();
    });

    const filterObserver = new MutationObserver(() => {
      if (allowedRepos.length > 0) applyFilter();
    });
    filterObserver.observe(document.body, { childList: true, subtree: true });

    /* --- UI MOUNTING --- */
    const ui = createIntegratedUi(ctx, {
      position: "inline",
      anchor: "body",
      onMount: (container) => {
        container.classList.add("my-extension", "my-extension-injected-ui");

        // Initialize theme composable logic
        const { loadAndWatch } = useGitHubTheme();
        loadAndWatch();

        const app = createApp(ListsView);
        app.mount(container);
        return app;
      },
      onRemove: (app) => app?.unmount(),
    });

    ui.mount();
  },
});
