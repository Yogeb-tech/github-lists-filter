import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-vue", "@wxt-dev/auto-icons"],
  autoIcons: {
    baseIconPath: "assets/icon.svg",
    sizes: [16, 32, 48, 96, 128, 256],
  },
  srcDir: "src",
  manifest: {
    name: "Better Repo Filter",
    description:
      "A browser extension that allows you to filter your repositories based on its list in github",
    version: "1.0.0",
    permissions: ["storage", "scripting"],
    host_permissions: ["https://github.com/", "https://api.github.com/*"],

    // Firefox Storage API support
    browser_specific_settings: {
      gecko: {
        id: "better-repo-filter@local-dev.com",
        strict_min_version: "142.0",
        data_collection_permissions: {
          description:
            "This extension stores a GitHub personal access token locally to fetch the user's starred repositories and lists. No data is sent to third parties.",
          required: ["authenticationInfo", "bookmarksInfo", "websiteActivity"],
        },
      } as any,
    },
  },
});
