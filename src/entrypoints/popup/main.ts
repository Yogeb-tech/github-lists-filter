import { useGitHubTheme } from "@/composables/useGithubTheme";
import "@picocss/pico/css/pico.min.css";
import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";

// TODO:
// Refactor
//
// Check to see if it turns into scroll bar upon too many lists

const { loadAndWatch } = useGitHubTheme();

// Load theme before mounting app
loadAndWatch()
  .then(() => {
    createApp(App).mount("#app");
  })
  .catch((error: any) => {
    console.error("Failed to load theme, mounting with default:", error);
    createApp(App).mount("#app");
  });
