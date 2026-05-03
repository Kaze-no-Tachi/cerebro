<script setup lang="ts">
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { useConnectionStore } from '@/stores/connection'

const router = useRouter()
const connection = useConnectionStore()
const { host, username, connected } = storeToRefs(connection)

function disconnect() {
  connection.clear()
  router.push('/connect')
}
</script>

<template>
  <main class="overview">
    <Card>
      <template #title>Overview</template>
      <template #subtitle>
        <span v-if="connected">
          Connected to <code>{{ host }}</code>
          <Tag v-if="username" :value="`as ${username}`" severity="info" style="margin-left: 0.5rem" />
        </span>
        <span v-else>Not connected</span>
      </template>
      <template #content>
        <p>
          The Overview view (cluster dashboard with nodes, indices, shards) hasn't been migrated to the new SPA yet.
          Until it lands, the legacy AngularJS Overview is still available at
          <a :href="`/?host=${encodeURIComponent(host || '')}#/overview`">the legacy URL</a>.
        </p>
        <Button label="Disconnect" icon="pi pi-sign-out" severity="secondary" @click="disconnect" />
      </template>
    </Card>
  </main>
</template>

<style scoped>
.overview {
  max-width: 720px;
  margin: 2rem auto;
  padding: 0 1rem;
}
</style>
