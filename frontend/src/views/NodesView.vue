<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import ProgressBar from 'primevue/progressbar'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

import { useNodesStore } from '@/stores/nodes'
import type { NodeRow } from '@/types/nodes'
import { formatBytes, formatDuration } from '@/utils/format'

const nodes = useNodesStore()
const { data, loading, error, lastUpdated } = storeToRefs(nodes)

const filter = ref('')
const showMaster = ref(true)
const showData = ref(true)
const showIngest = ref(true)
const showCoord = ref(true)

onMounted(() => nodes.load())

const filtered = computed<NodeRow[]>(() => {
  const q = filter.value.trim().toLowerCase()
  return data.value
    .filter((n) => {
      if (n.master && !showMaster.value) return false
      if (n.data && !showData.value) return false
      if (n.ingest && !showIngest.value) return false
      if (n.coordinating && !showCoord.value) return false
      return true
    })
    .filter((n) => !q || n.name.toLowerCase().includes(q))
})

const lastUpdatedText = computed(() =>
  lastUpdated.value ? lastUpdated.value.toLocaleTimeString() : '—',
)

function rolesFor(n: NodeRow): { icon: string; title: string; color?: string }[] {
  const out: { icon: string; title: string; color?: string }[] = []
  if (n.current_master) out.push({ icon: 'pi pi-star-fill', title: 'current master', color: '#f59e0b' })
  else if (n.master) out.push({ icon: 'pi pi-star', title: 'master eligible' })
  if (n.data) out.push({ icon: 'pi pi-database', title: 'data node' })
  if (n.ingest) out.push({ icon: 'pi pi-filter', title: 'ingest node' })
  if (n.coordinating) out.push({ icon: 'pi pi-share-alt', title: 'coordinating node' })
  return out
}
</script>

<template>
  <main class="nodes">
    <header class="header">
      <div>
        <h1>Nodes</h1>
        <small>{{ filtered.length }} of {{ data.length }} shown</small>
      </div>
      <div class="actions">
        <small>Updated {{ lastUpdatedText }}</small>
        <Button icon="pi pi-refresh" severity="secondary" text rounded :loading="loading" @click="nodes.load()" />
      </div>
    </header>

    <div class="filters">
      <InputText v-model="filter" placeholder="Filter nodes by name" size="small" style="min-width: 14rem" />
      <label class="check">
        <Checkbox v-model="showMaster" binary /> <i class="pi pi-star-fill" /> master
      </label>
      <label class="check">
        <Checkbox v-model="showData" binary /> <i class="pi pi-database" /> data
      </label>
      <label class="check">
        <Checkbox v-model="showIngest" binary /> <i class="pi pi-filter" /> ingest
      </label>
      <label class="check">
        <Checkbox v-model="showCoord" binary /> <i class="pi pi-share-alt" /> coordinating
      </label>
    </div>

    <ProgressSpinner v-if="!data.length && loading" style="display: block; margin: 4rem auto" />
    <Message v-else-if="error" severity="error" :closable="false">
      Failed to load nodes: {{ error }}
    </Message>

    <DataTable v-else :value="filtered" data-key="id" striped-rows size="small" sort-mode="single">
      <Column field="name" header="Node" sortable>
        <template #body="{ data: n }: { data: NodeRow }">
          <div class="node-cell">
            <div class="node-line">
              <i
                v-for="(r, idx) in rolesFor(n)"
                :key="idx"
                :class="r.icon"
                :style="r.color ? { color: r.color } : {}"
                :title="r.title"
              />
              <strong>{{ n.name }}</strong>
            </div>
            <small class="muted">{{ n.host || '' }}</small>
            <div class="badges">
              <Tag v-if="n.jvm" :value="`JVM ${n.jvm}`" severity="info" />
              <Tag :value="`ES ${n.version}`" severity="info" />
              <Tag
                v-for="(value, attr) in n.attributes"
                :key="attr"
                :value="String(value)"
                severity="secondary"
                :title="String(attr)"
              />
            </div>
          </div>
        </template>
      </Column>
      <Column field="cpu.load" header="Load" sortable style="width: 6rem">
        <template #body="{ data: n }: { data: NodeRow }">{{ n.cpu.load !== null ? n.cpu.load.toFixed(2) : '—' }}</template>
      </Column>
      <Column field="cpu.process" header="CPU" sortable style="width: 6rem">
        <template #body="{ data: n }: { data: NodeRow }">{{ n.cpu.process }}%</template>
      </Column>
      <Column field="heap.percent" header="Heap" sortable style="min-width: 9rem">
        <template #body="{ data: n }: { data: NodeRow }">
          <ProgressBar :value="n.heap.percent" :show-value="true" style="height: 0.875rem" />
          <small class="muted">{{ n.heap.used }} / {{ n.heap.max }}</small>
        </template>
      </Column>
      <Column field="disk.percent" header="Disk" sortable style="min-width: 9rem">
        <template #body="{ data: n }: { data: NodeRow }">
          <template v-if="n.disk">
            <ProgressBar :value="n.disk.percent" :show-value="true" style="height: 0.875rem" />
            <small class="muted">{{ formatBytes(n.disk.available) }} free / {{ formatBytes(n.disk.total) }}</small>
          </template>
          <template v-else>—</template>
        </template>
      </Column>
      <Column field="uptime" header="Uptime" sortable style="width: 8rem">
        <template #body="{ data: n }: { data: NodeRow }">{{ formatDuration(n.uptime) }}</template>
      </Column>
    </DataTable>
  </main>
</template>

<style scoped>
.nodes {
  padding: 1rem 1.5rem 2rem;
  max-width: 1280px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
  letter-spacing: -0.025em;
}

.actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
}

.filters {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.check {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: #374151;
}

.node-cell { display: flex; flex-direction: column; gap: 0.25rem; }
.node-line { display: flex; align-items: center; gap: 0.375rem; }
.muted { color: #6b7280; }
.badges { display: flex; gap: 0.25rem; flex-wrap: wrap; margin-top: 0.25rem; }
</style>
