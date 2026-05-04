<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

import { useOverviewStore } from '@/stores/overview'
import type { ClusterStatus } from '@/types/overview'
import { formatBytes, formatNumber } from '@/utils/format'
import ShardMap from '@/components/ShardMap.vue'

const REFRESH_MS = 30_000

const overview = useOverviewStore()
const { data, loading, error, lastUpdated } = storeToRefs(overview)

let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  overview.load()
  timer = setInterval(() => overview.load(), REFRESH_MS)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

const lastUpdatedText = computed(() =>
  lastUpdated.value ? lastUpdated.value.toLocaleTimeString() : '—',
)

function statusSeverity(status?: ClusterStatus) {
  switch (status) {
    case 'green':  return 'success'
    case 'yellow': return 'warn'
    case 'red':    return 'danger'
    default:       return 'secondary'
  }
}
</script>

<template>
  <main class="overview">
    <header v-if="data" class="cluster-header">
      <div class="cluster-id">
        <h1>{{ data.cluster_name }}</h1>
        <Tag :severity="statusSeverity(data.status)" :value="data.status" rounded />
      </div>
      <div class="cluster-stats">
        <div><span class="label">Nodes</span><span class="value">{{ data.number_of_nodes }}</span></div>
        <div><span class="label">Indices</span><span class="value">{{ data.total_indices }}</span></div>
        <div><span class="label">Shards</span><span class="value">{{ data.active_shards }}</span></div>
        <div v-if="data.relocating_shards"><span class="label">Relocating</span><span class="value warn">{{ data.relocating_shards }}</span></div>
        <div v-if="data.initializing_shards"><span class="label">Initializing</span><span class="value warn">{{ data.initializing_shards }}</span></div>
        <div v-if="data.unassigned_shards"><span class="label">Unassigned</span><span class="value danger">{{ data.unassigned_shards }}</span></div>
        <div><span class="label">Documents</span><span class="value">{{ formatNumber(data.docs_count) }}</span></div>
        <div><span class="label">Total size</span><span class="value">{{ formatBytes(data.size_in_bytes) }}</span></div>
      </div>
      <div class="actions">
        <small>Updated {{ lastUpdatedText }}</small>
        <Button icon="pi pi-refresh" severity="secondary" text rounded :loading="loading" @click="overview.load()" />
      </div>
    </header>

    <ProgressSpinner v-if="!data && loading" style="display: block; margin: 4rem auto" />
    <Message v-else-if="error" severity="error" :closable="false">
      Failed to load cluster overview: {{ error }}
    </Message>

    <ShardMap
      v-if="data"
      :indices="data.indices"
      :nodes="data.nodes"
      :unassigned-shards="data.unassigned_shards"
      :relocating-shards="data.relocating_shards"
      :initializing-shards="data.initializing_shards"
    />
  </main>
</template>

<style scoped>
.overview {
  padding: 1rem 1.5rem 2rem;
  max-width: 1280px;
  margin: 0 auto;
}

.cluster-header {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  gap: 0.75rem 1.5rem;
  margin-bottom: 1.25rem;
  align-items: end;
}

.cluster-id {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  grid-column: 1;
}

.cluster-id h1 {
  margin: 0;
  font-size: 1.5rem;
  letter-spacing: -0.025em;
}

.cluster-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  grid-column: 1 / -1;
  grid-row: 2;
}

.cluster-stats > div {
  display: flex;
  flex-direction: column;
  font-size: 0.8125rem;
}

.label {
  color: #6b7280;
  text-transform: uppercase;
  font-size: 0.6875rem;
  letter-spacing: 0.05em;
}

.value {
  font-weight: 600;
}

.value.warn  { color: #d97706; }
.value.danger { color: #dc2626; }

.actions {
  grid-column: 2;
  grid-row: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
}
</style>
