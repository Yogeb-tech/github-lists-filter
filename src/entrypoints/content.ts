import ListsView from "@/components/ListsView.vue";
import { createLogger } from "@/utils/logger";
import { createApp } from "vue";
import { createIntegratedUi } from "wxt/utils/content-script-ui/integrated";
import { defineContentScript } from "wxt/utils/define-content-script";
import "./popup/style.css";

const logger = createLogger("content.ts");

export default defineContentScript({
  // TODO: I need to refactor this to use the githubtheme composable
  matches: ["https://github.com/"],
  async main(ctx) {
    logger.debug("Content script started on GitHub page");

    function getGitHubTheme(): "light" | "dark" {
      const html = document.documentElement;
      const colorMode = html.getAttribute("data-color-mode");
      if (colorMode === "light" || colorMode === "dark") {
        return colorMode;
      }
      // Fallback
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    // Store initial theme
    const theme = getGitHubTheme();
    logger.debug(`Setting initial theme in storage: ${theme}`);
    await browser.storage.local.set({ githubTheme: theme });

    // Watch for theme changes (if user toggles while page is open)
    const themeObserver = new MutationObserver(() => {
      const newTheme = getGitHubTheme();
      logger.debug(`Theme changed to ${newTheme}, updating storage`);
      browser.storage.local.set({ githubTheme: newTheme });
    });

    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-color-mode"],
    });

    let allowedRepos: string[] = [];

    // Target the specific feed containers from HTML
    const getFeedContainer = (): Element | null => {
      const containerSelectors = [
        "#conduit-feed-frame",
        "feed-container",
        ".js-for-you-feed-items",
      ];

      for (const selector of containerSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          logger.debug(`Found feed container with selector: ${selector}`);
          return el;
        }
      }
      logger.warn("No feed container found");
      return null;
    };

    // Target the specific <article> cards from HTML
    const getFeedItems = (container: Element): NodeListOf<Element> => {
      return container.querySelectorAll("article.js-feed-item-component");
    };

    // Target the exact repository link format from HTML
    const getRepoNameFromItem = (item: Element): string | null => {
      const link = item.querySelector('a[data-hovercard-type="repository"]');
      if (link) {
        return (link as HTMLElement).innerText.replace(/\s+/g, "").trim();
      }
      return null;
    };

    const applyFilter = () => {
      logger.debug("Applying filter", { allowedRepos });

      const feed = getFeedContainer();
      if (!feed) {
        logger.warn("No feed container, skipping filter");
        return;
      }

      const items = getFeedItems(feed);
      logger.debug(`Found ${items.length} feed items`);

      let hiddenCount = 0;
      items.forEach((item) => {
        const htmlElement = item as HTMLElement;

        // If no filter is active, show everything
        if (allowedRepos.length === 0) {
          // Remove any previously set important rule
          htmlElement.style.setProperty("display", "", "important");
          return;
        }

        const repoName = getRepoNameFromItem(item);

        // Hide if the repo name doesn't match our allowed list
        if (repoName && !allowedRepos.includes(repoName)) {
          htmlElement.style.setProperty("display", "none", "important");
          hiddenCount++;
        } else {
          htmlElement.style.setProperty("display", "", "important");
        }
      });

      if (hiddenCount > 0) {
        logger.debug(`Hidden ${hiddenCount} items`);
      }
    };

    // Listen for filter changes from Vue – ensure repos is always an array
    window.addEventListener("github-filter-changed", (e: any) => {
      logger.debug("Received github-filter-changed event", e.detail);
      allowedRepos = e.detail.repos || []; // default to empty array
      applyFilter();
    });

    // Handle infinite scrolling / dynamic loading
    const observer = new MutationObserver(() => {
      if (allowedRepos.length > 0) {
        logger.debug("DOM mutation detected, reapplying filter");
        applyFilter();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    logger.debug("MutationObserver attached to document.body");

    // Mount the Vue UI
    const ui = createIntegratedUi(ctx, {
      position: "inline",
      anchor: "body",
      onMount: (container) => {
        logger.debug("Mounting Vue UI");
        container.classList.add("my-extension", "my-extension-injected-ui");

        const theme = getGitHubTheme();
        logger.debug("Theme is " + theme);
        if (theme == "dark") {
          container.classList.add("theme-dark");
        }

        const app = createApp(ListsView);
        app.mount(container);
        return app;
      },
      onRemove: (app) => {
        logger.debug("Removing Vue UI");
        app?.unmount();
      },
    });

    ui.mount();
    logger.debug("UI mounted");
  },
});
