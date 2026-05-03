<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

import { useOverviewStore } from '@/stores/overview'
import type { ClusterStatus, OverviewNode, OverviewIndex } from '@/types/overview'
import { formatBytes, formatNumber } from '@/utils/format'

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

function nodeRoles(n: OverviewNode): string[] {
  const roles: string[] = []
  if (n.master) roles.push('master')
  if (n.data) roles.push('data')
  if (n.ingest) roles.push('ingest')
  if (n.coordinating) roles.push('coord')
  return roles
}

function indexShardLabel(i: OverviewIndex) {
  if (i.num_shards == null) return '—'
  return `${i.num_shards} × ${i.num_replicas ?? 0}`
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

    <template v-if="data">
      <section class="card">
        <h2>Nodes <span class="muted">({{ data.nodes.length }})</span></h2>
        <DataTable :value="data.nodes" data-key="id" striped-rows size="small">
          <Column field="name" header="Name" sortable>
            <template #body="{ data: n }: { data: OverviewNode }">
              <i v-if="n.current_master" class="pi pi-star-fill master-star" title="Current master" />
              <span>{{ n.name }}</span>
            </template>
          </Column>
          <Column field="ip" header="Address" sortable>
            <template #body="{ data: n }: { data: OverviewNode }">
              <code>{{ n.ip || n.host || '—' }}</code>
            </template>
          </Column>
          <Column header="Roles">
            <template #body="{ data: n }: { data: OverviewNode }">
              <Tag v-for="r in nodeRoles(n)" :key="r" :value="r" severity="info" style="margin-right: 0.25rem" />
            </template>
          </Column>
          <Column field="es_version" header="Version" sortable />
          <Column header="Heap" style="min-width: 8rem">
            <template #body="{ data: n }: { data: OverviewNode }">
              <ProgressBar :value="n.heap.used_percent" :show-value="true" style="height: 0.875rem" />
            </template>
          </Column>
          <Column header="Disk" style="min-width: 8rem">
            <template #body="{ data: n }: { data: OverviewNode }">
              <ProgressBar :value="n.disk.used_percent" :show-value="true" style="height: 0.875rem" />
            </template>
          </Column>
          <Column header="CPU" style="width: 5rem">
            <template #body="{ data: n }: { data: OverviewNode }">{{ n.cpu_percent }}%</template>
          </Column>
          <Column header="Load" style="width: 5rem">
            <template #body="{ data: n }: { data: OverviewNode }">{{ n.load_average.toFixed(2) }}</template>
          </Column>
        </DataTable>
      </section>

      <section class="card">
        <h2>Indices <span class="muted">({{ data.indices.length }})</span></h2>
        <DataTable
          :value="data.indices"
          data-key="name"
          striped-rows
          size="small"
          :paginator="data.indices.length > 25"
          :rows="25"
          :rows-per-page-options="[25, 50, 100]"
        >
          <Column header="" style="width: 1rem">
            <template #body="{ data: i }: { data: OverviewIndex }">
              <i v-if="i.unhealthy" class="pi pi-circle-fill" style="color: #f59e0b" title="Unhealthy" />
              <i v-else-if="i.closed" class="pi pi-lock" title="Closed" />
            </template>
          </Column>
          <Column field="name" header="Name" sortable>
            <template #body="{ data: i }: { data: OverviewIndex }">
              <code>{{ i.name }}</code>
              <Tag v-if="i.special" value="system" severity="secondary" style="margin-left: 0.5rem" />
            </template>
          </Column>
          <Column field="doc_count" header="Documents" sortable>
            <template #body="{ data: i }: { data: OverviewIndex }">{{ formatNumber(i.doc_count) }}</template>
          </Column>
          <Column field="size_in_bytes" header="Primary size" sortable>
            <template #body="{ data: i }: { data: OverviewIndex }">{{ formatBytes(i.size_in_bytes) }}</template>
          </Column>
          <Column field="total_size_in_bytes" header="Total size" sortable>
            <template #body="{ data: i }: { data: OverviewIndex }">{{ formatBytes(i.total_size_in_bytes) }}</template>
          </Column>
          <Column header="Shards × Replicas">
            <template #body="{ data: i }: { data: OverviewIndex }">{{ indexShardLabel(i) }}</template>
          </Column>
          <Column header="Aliases">
            <template #body="{ data: i }: { data: OverviewIndex }">
              <Tag
                v-for="a in i.aliases"
                :key="a"
                :value="a"
                severity="info"
                style="margin-right: 0.25rem; margin-bottom: 0.125rem"
              />
            </template>
          </Column>
        </DataTable>
      </section>
    </template>
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

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
}

.card h2 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  font-weight: 600;
}

.muted {
  color: #6b7280;
  font-weight: 400;
  margin-left: 0.25rem;
}

.master-star {
  color: #f59e0b;
  margin-right: 0.4rem;
}
</style>
