<script setup lang="ts">
import { computed, ref } from 'vue'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import Paginator from 'primevue/paginator'
import Tag from 'primevue/tag'
import { formatBytes, formatNumber } from '@/utils/format'
import type { OverviewIndex, OverviewNode, ShardInfo } from '@/types/overview'

const props = defineProps<{
  indices: OverviewIndex[]
  nodes: OverviewNode[]
  unassignedShards: number
  relocatingShards: number
  initializingShards: number
}>()

const filter = ref('')
const showClosed = ref(true)
const showSpecial = ref(false)

const PAGE_SIZE = 5
const pageFirst = ref(0)

// Step 1: filter the index list (name + aliases match, closed/special toggles).
const filteredIndices = computed<OverviewIndex[]>(() => {
  const q = filter.value.trim().toLowerCase()
  return props.indices
    .filter((i) => showClosed.value || !i.closed)
    .filter((i) => showSpecial.value || !i.special)
    .filter((i) => {
      if (!q) return true
      if (i.name.toLowerCase().includes(q)) return true
      return i.aliases.some((a) => a.toLowerCase().includes(q))
    })
    .sort((a, b) => a.name.localeCompare(b.name))
})

// Step 2: paginate.
const pagedIndices = computed<OverviewIndex[]>(() =>
  filteredIndices.value.slice(pageFirst.value, pageFirst.value + PAGE_SIZE),
)

// Reset to first page whenever the filter changes the result set length.
function onFilterChange() {
  pageFirst.value = 0
}

// Nodes are sorted by name, master first within ties is implicit since master
// is its own row but kept in alphabetical order with the rest.
const sortedNodes = computed<OverviewNode[]>(() =>
  [...props.nodes].sort((a, b) => a.name.localeCompare(b.name)),
)

function shardClass(shard: ShardInfo, indexClosed: boolean): string {
  const base = `shard shard-${shard.state.toLowerCase()}`
  const replica = !shard.primary && shard.node ? ' shard-replica' : ''
  const closed = indexClosed ? ' shard-closed' : ''
  return base + replica + closed
}

function shardsFor(index: OverviewIndex, key: string): ShardInfo[] {
  const all = index.shards?.[key] ?? []
  return [...all].sort((a, b) => a.shard - b.shard)
}

function unassignedFor(index: OverviewIndex): ShardInfo[] {
  return shardsFor(index, 'unassigned')
}

function nodeRolesIcons(node: OverviewNode): { icon: string; title: string }[] {
  const out: { icon: string; title: string }[] = []
  if (node.current_master) out.push({ icon: 'pi pi-star-fill', title: 'current master' })
  else if (node.master) out.push({ icon: 'pi pi-star', title: 'master eligible' })
  if (node.data) out.push({ icon: 'pi pi-database', title: 'data node' })
  if (node.ingest) out.push({ icon: 'pi pi-filter', title: 'ingest node' })
  return out
}

const showProblemRow = computed(
  () =>
    props.unassignedShards > 0 ||
    props.relocatingShards > 0 ||
    props.initializingShards > 0,
)

function pct(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}
</script>

<template>
  <section class="shard-map-section">
    <div class="filters">
      <InputText
        v-model="filter"
        placeholder="Filter indices by name or alias"
        size="small"
        @input="onFilterChange"
      />
      <label class="checkbox">
        <Checkbox v-model="showClosed" binary @change="onFilterChange" />
        <span>closed</span>
      </label>
      <label class="checkbox">
        <Checkbox v-model="showSpecial" binary @change="onFilterChange" />
        <span>.special</span>
      </label>
      <span class="count">{{ filteredIndices.length }} of {{ indices.length }} indices</span>
    </div>

    <div class="map-scroll">
      <table class="shard-map">
        <thead>
          <tr>
            <th class="corner">
              <small>{{ sortedNodes.length }} node{{ sortedNodes.length === 1 ? '' : 's' }}</small>
            </th>
            <th
              v-for="i in pagedIndices"
              :key="i.name"
              class="index-head"
              :class="{ closed: i.closed }"
            >
              <div class="index-name">
                <code>{{ i.name }}</code>
                <Tag v-if="i.special" value="system" severity="secondary" />
                <Tag v-if="i.closed" value="closed" severity="warn" />
              </div>
              <div v-if="i.aliases.length" class="aliases">
                <i class="pi pi-tag" />
                {{ i.aliases[0] }}
                <span v-if="i.aliases.length > 1">(+{{ i.aliases.length - 1 }})</span>
              </div>
              <div class="detail" v-if="!i.closed">
                <small>
                  shards: {{ i.num_shards ?? '?' }} × {{ (i.num_replicas ?? 0) + 1 }}
                  · docs: {{ formatNumber(i.doc_count) }}
                  · {{ formatBytes(i.size_in_bytes) }}
                </small>
              </div>
              <div class="detail" v-else>
                <small><i>index closed</i></small>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="showProblemRow" class="problems">
            <td class="row-head">
              <div v-if="unassignedShards > 0" class="warn">
                <i class="pi pi-exclamation-triangle" /> {{ unassignedShards }} unassigned
              </div>
              <div v-if="relocatingShards > 0" class="info">
                <i class="pi pi-refresh pi-spin" /> {{ relocatingShards }} relocating
              </div>
              <div v-if="initializingShards > 0" class="info">
                <i class="pi pi-spinner pi-spin" /> {{ initializingShards }} initializing
              </div>
            </td>
            <td v-for="i in pagedIndices" :key="i.name" class="cell">
              <span
                v-for="(shard, idx) in unassignedFor(i)"
                :key="idx"
                :class="shardClass(shard, i.closed)"
                :title="`shard ${shard.shard} ${shard.state}`"
              >
                <small>{{ shard.shard }}</small>
              </span>
            </td>
          </tr>

          <tr v-for="node in sortedNodes" :key="node.id" class="node-row">
            <td class="row-head node-head">
              <div class="node-line">
                <i
                  v-for="(r, idx) in nodeRolesIcons(node)"
                  :key="idx"
                  :class="r.icon"
                  :title="r.title"
                />
                <span class="node-name">{{ node.name }}</span>
              </div>
              <div class="node-meta">
                <small>{{ node.host || node.ip || '' }} · v{{ node.es_version }}</small>
              </div>
              <div class="node-bars">
                <div class="bar" :title="`heap ${node.heap.used_percent}%`">
                  <span class="bar-label">heap</span>
                  <span class="bar-track"><span class="bar-fill" :style="{ width: pct(node.heap.used_percent) + '%' }"></span></span>
                  <span class="bar-value">{{ node.heap.used_percent }}%</span>
                </div>
                <div class="bar" :title="`disk ${node.disk.used_percent}%`">
                  <span class="bar-label">disk</span>
                  <span class="bar-track"><span class="bar-fill" :style="{ width: pct(node.disk.used_percent) + '%' }"></span></span>
                  <span class="bar-value">{{ node.disk.used_percent }}%</span>
                </div>
                <div class="bar" :title="`cpu ${node.cpu_percent}%`">
                  <span class="bar-label">cpu</span>
                  <span class="bar-track"><span class="bar-fill" :style="{ width: pct(node.cpu_percent) + '%' }"></span></span>
                  <span class="bar-value">{{ node.cpu_percent }}%</span>
                </div>
                <div class="bar" :title="`load ${node.load_average.toFixed(2)} / ${node.available_processors} cpu`">
                  <span class="bar-label">load</span>
                  <span class="bar-track"><span class="bar-fill" :style="{ width: pct((node.load_average / Math.max(1, node.available_processors)) * 100) + '%' }"></span></span>
                  <span class="bar-value">{{ node.load_average.toFixed(2) }}</span>
                </div>
              </div>
            </td>
            <td v-for="i in pagedIndices" :key="i.name" class="cell" :class="{ closed: i.closed }">
              <span
                v-for="(shard, idx) in shardsFor(i, node.id)"
                :key="idx"
                :class="shardClass(shard, i.closed)"
                :title="`shard ${shard.shard} (${shard.primary ? 'primary' : 'replica'}) — ${shard.state}`"
              >
                <small>{{ shard.shard }}</small>
              </span>
            </td>
          </tr>

          <tr v-if="pagedIndices.length === 0">
            <td :colspan="1" class="row-head"></td>
            <td class="empty">No indices match the current filter.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Paginator
      v-if="filteredIndices.length > PAGE_SIZE"
      :first="pageFirst"
      :rows="PAGE_SIZE"
      :total-records="filteredIndices.length"
      @page="(e: { first: number }) => (pageFirst = e.first)"
    />
  </section>
</template>

<style scoped>
.shard-map-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem 1.25rem;
}

.filters {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.checkbox {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
}

.count {
  color: #6b7280;
  font-size: 0.8125rem;
  margin-left: auto;
}

.map-scroll {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.shard-map {
  border-collapse: collapse;
  width: 100%;
  table-layout: fixed;
  font-size: 0.875rem;
}

.shard-map th,
.shard-map td {
  border: 1px solid #e5e7eb;
  padding: 0.5rem;
  vertical-align: top;
}

.shard-map thead th {
  background: #f9fafb;
  position: sticky;
  top: 0;
  z-index: 2;
}

.row-head,
.corner {
  background: #f9fafb;
  position: sticky;
  left: 0;
  z-index: 1;
  width: 240px;
  min-width: 240px;
}

.corner {
  z-index: 3;
}

.index-head {
  width: 200px;
  min-width: 200px;
}

.index-head.closed {
  opacity: 0.55;
}

.index-name {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
  word-break: break-all;
}

.aliases {
  margin-top: 0.25rem;
  color: #6b7280;
  font-size: 0.75rem;
}

.detail {
  margin-top: 0.25rem;
  color: #6b7280;
}

.problems .row-head {
  vertical-align: middle;
}

.problems .warn  { color: #d97706; }
.problems .info  { color: #2563eb; }

.node-head {
  font-size: 0.875rem;
}

.node-line {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-bottom: 0.125rem;
}

.node-name {
  font-weight: 600;
}

.node-meta {
  color: #6b7280;
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
}

.node-bars {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.25rem 0.625rem;
}

.bar {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6875rem;
}

.bar-label {
  color: #6b7280;
  width: 1.875rem;
  flex-shrink: 0;
}

.bar-track {
  flex: 1;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}

.bar-fill {
  display: block;
  height: 100%;
  background: #6366f1;
  transition: width 0.3s ease;
}

.bar-value {
  width: 2.25rem;
  text-align: right;
  color: #4b5563;
}

.cell {
  min-height: 32px;
}

.empty {
  text-align: center;
  color: #6b7280;
  padding: 2rem !important;
}

/* Shard cells: same color scheme as the legacy AngularJS dashboard */
.shard {
  display: inline-block;
  width: 22px;
  height: 22px;
  margin: 1px;
  text-align: center;
  line-height: 17px;
  vertical-align: middle;
  font-size: 0.6875rem;
}

.shard-started      { border: 2px solid #1AC98E; color: #1AC98E; }
.shard-initializing { border: 1px solid #1CA8DD; color: #1CA8DD; }
.shard-relocating,
.shard-relocated    { border: 1px solid #9F85FF; color: #9F85FF; }
.shard-recovering   { border: 1px solid #E4D836; color: #E4D836; }
.shard-unassigned   { border: 1px solid #8B8F95; color: #8B8F95; }
.shard-replica      { border-style: dashed; opacity: 0.85; }
.shard-closed       { opacity: 0.35; }
</style>
