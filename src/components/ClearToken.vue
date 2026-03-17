<!-- components/ClearToken.vue -->
<script lang="ts" setup>
import { clearToken } from "@/utils/token";
import { tokenState } from "@/utils/token";

const { loading } = tokenState;

async function handleClear() {
  await clearToken();
}
</script>

<template>
  <button
    class="clear-token-btn"
    @click="handleClear"
    :disabled="loading"
    title="Clear GitHub token and sign out"
  >
    <span v-if="loading">Clearing...</span>
    <span v-else>Clear Token</span>
  </button>
</template>

<style scoped>
.clear-token-btn {
  background: transparent;
  border: 1px solid var(--error-color);
  border-radius: 4px;
  padding: 4px 8px;
  color: var(--error-color);
  font-size: var(--font-sm, 0.875rem);
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: 8px;
}

.clear-token-btn:hover:not(:disabled) {
  background: var(--error-color);
  color: var(--button-bog);
}

.clear-token-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
