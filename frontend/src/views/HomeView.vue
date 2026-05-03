<script setup lang="ts">
import { onMounted } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import { useHostsStore } from '@/stores/hosts'
import { storeToRefs } from 'pinia'

const store = useHostsStore()
const { hosts, loading, error } = storeToRefs(store)

onMounted(() => {
  store.load()
})
</script>

<template>
  <main class="home">
    <Card>
      <template #title>cerebro · next-gen UI</template>
      <template #subtitle>
        Vue 3 + Vite + PrimeVue scaffold. Lives at <code>/next</code>; legacy AngularJS UI is still at <code>/</code>.
      </template>
      <template #content>
        <p>
          This is the new SPA shell. The backend API contract lives in
          <code>docs/api.md</code>. Each cerebro view will be migrated one at a
          time and ship behind this URL until parity, then we swap defaults and
          retire the AngularJS bundle.
        </p>

        <h3>Backend wiring smoke test</h3>
        <p>Calls <code>GET /connect/hosts</code> through the dev proxy / production reverse-proxy:</p>

        <ProgressSpinner v-if="loading" style="width: 32px; height: 32px" />
        <Message v-else-if="error" severity="error" :closable="false">
          {{ error }}
          <br />
          <small>Make sure the Play backend is running on :9000.</small>
        </Message>
        <Message v-else-if="hosts.length === 0" severity="info" :closable="false">
          Connected, but no hosts are configured in <code>application.conf</code>.
        </Message>
        <ul v-else>
          <li v-for="h in hosts" :key="h">{{ h }}</li>
        </ul>

        <Button
          icon="pi pi-refresh"
          label="Reload"
          severity="secondary"
          size="small"
          :loading="loading"
          @click="store.load()"
        />
      </template>
    </Card>
  </main>
</template>

<style scoped>
.home {
  max-width: 720px;
  margin: 2rem auto;
  padding: 0 1rem;
}
</style>
