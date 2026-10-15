import ListsView from "@/components/ListsView.vue";
import { createLogger } from "@/utils/logger";
import { createApp, defineComponent, h } from "vue";
import { createIntegratedUi } from "wxt/utils/content-script-ui/integrated";
import { defineContentScript } from "wxt/utils/define-content-script";
import "./popup/style.css";
import { getGitHubTheme, useGitHubTheme } from "@/composables/useGithubTheme";

const logger = createLogger("content.ts");

// Wrapper component so useGitHubTheme() runs inside Vue setup()
const App = defineComponent({
  setup() {
    const { loadAndWatch } = useGitHubTheme();
    loadAndWatch();

    return () => h(ListsView);
  },
});

function waitForElement(selector: string, timeout = 10000): Promise<Element> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(selector);
    if (existing) return resolve(existing);

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timed out waiting for ${selector}`));
    }, timeout);
  });
}

export default defineContentScript({
  matches: ["https://github.com/feed*"],
  async main(ctx) {
    logger.debug("Content script started");

    /* --- THEME SYNC LOGIC --- */
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
    let anchor: Element;
    try {
      anchor = await waitForElement("aside.feed-right-column");
    } catch (err) {
      logger.error("Could not find feed sidebar anchor:", err);
      return;
    }

    const ui = createIntegratedUi(ctx, {
      position: "inline",
      anchor,
      onMount: (container) => {
        container.classList.add("my-extension", "my-extension-injected-ui");

        const app = createApp(App);
        app.mount(container);
        return app;
      },
      onRemove: (app) => app?.unmount(),
    });

    ui.mount();
  },
});
