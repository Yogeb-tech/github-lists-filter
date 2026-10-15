import { CONSTANTS } from "@/constants/constants";
import { GitHubService } from "@/utils/github";
import { createLogger } from "@/utils/logger";
import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";

const logger = createLogger("background.ts");

export default defineBackground(() => {
  let githubService: GitHubService | null = null;

  async function initService() {
    logger.debug("Background: Initializing GitHub service");
    const result = await browser.storage.local.get("githubToken");
    logger.debug("Background: Storage result:", result);

    const githubToken = result.githubToken;

    if (githubToken && typeof githubToken === "string") {
      logger.debug("Background: Found token in storage");
      githubService = new GitHubService(githubToken);
    } else {
      logger.warn("Background: No token found in storage");
    }
  }

  // Re-initialize if token changes in storage
  browser.storage.onChanged.addListener((changes, area) => {
    logger.debug("Background: Storage changed:", area, changes);
    if (area === "sync" && changes.githubToken) {
      logger.debug("Background: Token changed, re-initializing");
      initService();
    }
  });

  browser.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === "install") {
      logger.debug("Background: First install detected, opening GitHub");

      await browser.tabs.create({
        url: CONSTANTS.GITHUB_GENERATE_KEY,
        active: true, // Make sure it brings the tab to the front
      });
    }
  });
  initService();
});
