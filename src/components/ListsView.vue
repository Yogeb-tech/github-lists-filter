<script lang="ts" setup>
import { loadToken, tokenState } from "@/utils/token";
import { onMounted, ref, watch } from "vue";
import NoTokenFound from "./NoTokenFound.vue";

const { user, lists, loading, githubService } = tokenState;
const selectedListSlugs = ref<Set<string>>(new Set()); // track checked lists by slug (for display)
const listRepos = ref<Map<string, string[]>>(new Map()); // cache repo names per list ID
const fetching = ref<Set<string>>(new Set()); // track which list IDs are being fetched

onMounted(loadToken);

watch(
  selectedListSlugs,
  async (newSet) => {
    if (newSet.size === 0) {
      window.dispatchEvent(
        new CustomEvent("github-filter-changed", {
          detail: { repos: [] },
        }),
      );
      return;
    }

    // Get the IDs of selected lists
    const selectedLists = lists.value?.filter((l) => newSet.has(l.slug)) || [];
    const selectedIds = selectedLists.map((l) => l.id);

    // Fetch missing repos
    const missing = selectedIds.filter((id) => !listRepos.value.has(id));
    if (missing.length > 0) {
      await Promise.all(
        missing.map(async (id) => {
          fetching.value.add(id);
          try {
            const repos = (await githubService.value?.getListRepos(id)) || [];
            listRepos.value.set(id, repos);
          } catch (err) {
            console.error(`Failed to fetch repos for list ${id}`, err);
            listRepos.value.set(id, []);
          } finally {
            fetching.value.delete(id);
          }
        }),
      );
    }

    // Combine and deduplicate
    const allRepos = selectedIds.flatMap((id) => listRepos.value.get(id) || []);
    const uniqueRepos = [...new Set(allRepos)];

    window.dispatchEvent(
      new CustomEvent("github-filter-changed", {
        detail: { repos: uniqueRepos },
      }),
    );
  },
  { deep: true },
);

function toggleList(slug: string, checked: boolean) {
  const newSet = new Set(selectedListSlugs.value);
  if (checked) {
    newSet.add(slug);
  } else {
    newSet.delete(slug);
  }
  selectedListSlugs.value = newSet;
}

function clearAll() {
  selectedListSlugs.value = new Set();
}
</script>

<template>
  <div class="lists-panel">
    <h3>Feed Filters</h3>

    <div v-if="loading">Loading lists...</div>

    <div v-else-if="(!githubService && !loading) || !user">
      <NoTokenFound />
      <p>Input this token into the browser extension. Then reload the page</p>
    </div>

    <div v-else class="filter-options">
      <div class="list-item clear-all">
        <label>
          <input
            type="checkbox"
            :checked="selectedListSlugs.size === 0"
            @change="clearAll"
            class="checkbox"
          />
          <span>No Filter (show all)</span>
        </label>
      </div>

      <div v-for="list in lists" :key="list.slug" class="list-item">
        <label>
          <input
            type="checkbox"
            :value="list.slug"
            :checked="selectedListSlugs.has(list.slug)"
            @change="
              (e) =>
                toggleList(list.slug, (e.target as HTMLInputElement).checked)
            "
          />
          <span>
            {{ list.name }} ({{ list.items.totalCount }})
            <span v-if="fetching.has(list.id)" class="spinner"> ⟳</span>
          </span>
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lists-panel {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 12px;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 6px 0;
  cursor: pointer;
  color: var(--text-primary);
}

.clear-all {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 6px;
  margin-bottom: 6px;
}

.spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
