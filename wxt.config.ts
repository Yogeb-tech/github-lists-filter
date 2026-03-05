import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-vue"],
  srcDir: "src",
  manifest: {
    name: "Improved Github Dashboard",
    description:
      "A browser extension that allows you to filter your repositories based on its list",
    version: "1.0.0",
    permissions: ["storage", "scripting"],
    host_permissions: ["https://github.com/*"],
  },
});
