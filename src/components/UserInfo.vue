<script lang="ts" setup>
import { loadToken, saveToken, tokenState } from "@/utils/token";
import { onMounted, ref } from "vue";
import ClearToken from "./ClearToken.vue";
import { Icon } from "@iconify/vue";

const { loading, error, user, githubService } = tokenState;
const inputToken = ref("");
const logger = createLogger("UserInfo.vue");

onMounted(loadToken);

function handleSave() {
  if (!inputToken.value.trim()) return;
  saveToken(inputToken.value.trim()).then((success) => {
    if (success) {
      inputToken.value = ""; // clear input on success
    }
  });
}
</script>

<template>
  <div class="github-extension-panel">
    <!-- Header with title and social icons -->
    <div class="header">
      <h3>Improved Repo Filter</h3>
      <div class="header-icons">
        <!-- Ko‑fi icon -->
        <a
          href="https://ko-fi.com/yogeb"
          target="_blank"
          rel="noopener noreferrer"
          class="icon-link"
          title="Support me on Ko‑fi"
        >
          <Icon icon="simple-icons:kofi" width="18" height="18" />
        </a>

        <!-- GitHub icon -->
        <a
          href="https://github.com/Yogeb-tech/better-repo-filter"
          target="_blank"
          rel="noopener noreferrer"
          class="icon-link"
          title="View source on GitHub"
        >
          <Icon icon="simple-icons:github" width="18" height="18" />
        </a>
      </div>
    </div>

    <div class="main-content">
      <!-- Token input prompt (no token or invalid token) -->
      <div
        v-if="
          (!githubService || (githubService && !user && !loading)) && !loading
        "
        class="state-content"
      >
        <input
          v-model="inputToken"
          type="text"
          placeholder="Enter GitHub token (ghp_xxx...)"
          :disabled="loading"
        />
        <button @click="handleSave" :disabled="loading">
          {{ loading ? "Saving..." : "Save Token" }}
        </button>
        <p v-if="error" class="error">ERROR: {{ error }}</p>
        <p class="hint">
          <a
            href="https://github.com/settings/tokens"
            target="_blank"
            rel="noopener"
          >
            Generate a token
          </a>
          with <code>repo</code> and <code>read:user</code> scopes.
        </p>
      </div>

      <!-- Loading state -->
      <div v-else-if="loading" class="state-content">Loading...</div>

      <!-- User info when ready -->
      <div v-else-if="user" class="state-content">
        Logged in as: <strong>{{ user.login }}</strong>
      </div>
    </div>

    <!-- Footer: show clear button when logged in -->
    <div v-if="user" class="footer">
      <ClearToken />
    </div>
  </div>
</template>

<style scoped>
.github-extension-panel {
  background: var(--bg-primary);
  padding: 16px;
  font-family: var(--font-mono);
  font-size: var(--font-base);
  color: var(--text-primary);
  width: 100%;
  height: 100%;
  min-width: 350px;
  margin: 0;
  display: flex;

  /* To put footer at the end */
  flex-direction: column;
  box-sizing: border-box;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 8px;
}

.header h3 {
  margin: 0;
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: none;
  padding-bottom: 0;
}

.header-icons {
  display: flex;
  gap: 12px;
}

.header-icons .icon-link {
  color: var(--text-secondary);
  transition: color var(--transition-fast);
  display: inline-flex;
  align-items: center;
  line-height: 1;
}

.header-icons .icon-link:hover {
  color: var(--accent-color);
}

.main-content {
  flex: 1;
  margin-bottom: 12px;
}

.state-content {
  color: var(--text-secondary);
  line-height: 1.5;
}

.footer {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--border-color);
  padding-top: 12px;
}

.github-extension-panel a {
  color: var(--accent-color);
  text-decoration: none;
}

.github-extension-panel a:hover {
  color: var(--accent-hover);
  text-decoration: underline;
}

.github-extension-panel code {
  font-family: var(--font-mono, "SF Mono", Monaco, Consolas, monospace);
  font-size: var(--font-sm);
  background: var(--bg-secondary);
  padding: 2px 4px;
  border-radius: 3px;
  border: 1px solid var(--border-color);
}

.github-extension-panel input[type="text"] {
  width: 100%;
  padding: 8px 12px;
  margin: 8px 0;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: var(--font-base);
  font-family: var(--font-mono, monospace);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
  box-sizing: border-box;
}

.github-extension-panel input[type="text"]:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.3);
}

.github-extension-panel input[type="text"]:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.github-extension-panel button {
  background: var(--button-bg);
  border: 1px solid var(--button-border);
  border-radius: 6px;
  padding: 8px 16px;
  color: var(--text-primary);
  font-size: var(--font-base);
  font-weight: 500;
  cursor: pointer;
  transition:
    background var(--transition-fast),
    border-color var(--transition-fast);
  width: 100%;
}

.github-extension-panel button:hover:not(:disabled) {
  background: var(--bg-secondary);
  border-color: var(--border-color);
}

.github-extension-panel button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.github-extension-panel .error {
  color: var(--error-color);
  font-size: var(--font-sm);
  margin-top: 8px;
  padding: 8px;
  background: var(--bg-secondary);
  border-radius: 4px;
  border-left: 3px solid var(--error-color);
}

.github-extension-panel strong {
  color: var(--text-primary);
}

.hint {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  margin-top: 8px;
  text-align: center;
}
.hint a {
  color: var(--accent-color);
  text-decoration: none;
}
.hint a:hover {
  text-decoration: underline;
}
</style>
