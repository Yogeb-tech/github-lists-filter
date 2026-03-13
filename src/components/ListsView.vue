/* TODO: Finish this script - This should display all the users list like a todo
list */
<script lang="ts" setup>
import { loadToken, tokenState } from "@/utils/token";

const { token: storedToken, loading, error, lists, githubService } = tokenState;

onMounted(loadToken);
</script>
<template>
  <div class="lists-panel">
    <h3>Filters Panel</h3>

    <!-- Show message if no lists -->
    <div v-if="!lists || lists.length === 0">
      <p>No lists available</p>
    </div>

    <!-- Otherwise, render the lists -->
    <div v-else>
      <div class="list-type" v-for="list in lists">
        <label>
          <div>List type is {{ list.name }}</div>
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lists-panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 8px;
  box-sizing: border-box;
}
</style>
