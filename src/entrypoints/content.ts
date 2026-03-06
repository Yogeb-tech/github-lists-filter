import { createApp } from "vue";
import { createIntegratedUi } from "wxt/client";
import { defineContentScript } from "wxt/sandbox";
import App from "./App.vue";

export default defineContentScript({
  matches: ["<all_urls>"],
  main(ctx) {
    const ui = createIntegratedUi(ctx, {
      position: "inline",
      anchor: "body",
      onMount: (container) => {
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
