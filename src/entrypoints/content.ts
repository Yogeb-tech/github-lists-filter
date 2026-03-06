import { createGitHubService } from "@/utils/github";
import { createApp } from "vue";
import { createIntegratedUi } from "wxt/utils/content-script-ui/integrated";
import { defineContentScript } from "wxt/utils/define-content-script";
import App from "./popup/App.vue";

export default defineContentScript({
  matches: ["https://github.com/*"],
  async main(ctx) {
    console.log("Content script started");

    const service = await createGitHubService();

    const ui = createIntegratedUi(ctx, {
      position: "inline", // "inline" works with body as anchor; container becomes a direct child of body
      anchor: "body",
      onMount: (container) => {
        // Make it a fixed floating panel
        container.style.cssText = `
          position: fixed;
          top: 60px;
          right: 20px;
          z-index: 9999;
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          padding: 12px;
          width: 280px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        container.classList.add("my-extension-floating-panel");

        const app = createApp(App);
        app.provide("githubService", service);
        app.mount(container);
        return app;
      },
      onRemove: (app) => {
        app?.unmount();
      },
    });

    ui.mount();
  },
});
