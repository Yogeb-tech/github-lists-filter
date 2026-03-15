import type { GithubList } from "@/types/types";
import { createLogger } from "@/utils/logger";
import { readonly, ref } from "vue";
import { browser } from "wxt/browser";
import { clearGithubInstance, getGitHubService, GitHubService } from "./github";

// Reactive state shared across the extension
const token = ref<string | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const user = ref<{ login: string } | null>(null);
const lists = ref<GithubList[] | null>(null);
const githubService = ref<GitHubService | null>(null);

const logger = createLogger("token.ts");

// Load token from storage and initialize service
export async function loadToken() {
  loading.value = true;
  error.value = null;
  try {
    const result = await browser.storage.sync.get("githubToken");
    token.value =
      typeof result.githubToken === "string" ? result.githubToken : null;

    if (token.value) {
      githubService.value = await getGitHubService();
      if (githubService.value) {
        user.value = await githubService.value.getUser();
        lists.value = await githubService.value.getUserLists();
      } else {
        user.value = null;
      }
    } else {
      githubService.value = null;
      user.value = null;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to load token";
    logger.error("Token load error:", err);
  } finally {
    loading.value = false;
  }
}

// Save token to storage and reinitialize
export async function saveToken(newToken: string) {
  if (!newToken.trim()) {
    error.value = "Please enter a token";
    return false;
  }

  loading.value = true;
  error.value = null;

  try {
    await browser.storage.sync.set({ githubToken: newToken.trim() });
    // Clear cached service so next getGitHubService() uses the new token
    clearGithubInstance();
    token.value = newToken.trim();
    await loadToken(); // Reload service and user with new token
    return true;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to save token";
    logger.error("Token save error:", err);
    return false;
  } finally {
    loading.value = false;
  }
}

// Clear token
export async function clearToken() {
  loading.value = true;
  try {
    await browser.storage.sync.remove("githubToken");
    clearGithubInstance();
    token.value = null;
    githubService.value = null;
    user.value = null;
    error.value = null;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to clear token";
  } finally {
    loading.value = false;
  }
}

// Expose readonly reactive state
export const tokenState = {
  token: readonly(token),
  loading: readonly(loading),
  error: readonly(error),
  user: readonly(user),
  lists: readonly(lists),
  githubService: readonly(githubService),
};
