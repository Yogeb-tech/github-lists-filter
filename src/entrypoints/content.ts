import { createApp } from "vue";
import { createIntegratedUi } from "wxt/utils/content-script-ui/integrated";
import { defineContentScript } from "wxt/utils/define-content-script";
import "../assets/theme.css";
import App from "./popup/App.vue";

export default defineContentScript({
  matches: ["https://github.com/*"],
  async main(ctx) {
    console.log("Content script started");

    const ui = createIntegratedUi(ctx, {
      position: "inline",
      anchor: "body",
      onMount: (container) => {
        container.style.cssText = `
          position: fixed;
          top: 60px;
          right: 20px;
          z-index: 9999;
          padding: 12px;
          width: 280px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        container.classList.add("my-extension-floating-panel");

        const app = createApp(App);
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
