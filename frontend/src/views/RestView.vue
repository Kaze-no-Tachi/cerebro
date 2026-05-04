<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import AutoComplete from 'primevue/autocomplete'
import Select from 'primevue/select'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'

import { useConnectionStore } from '@/stores/connection'
import { useRestStore } from '@/stores/rest'
import { ES_PATHS } from '@/data/esPaths'
import MonacoEditor from '@/components/MonacoEditor.vue'

const connection = useConnectionStore()
const rest = useRestStore()
const toast = useToast()

const { method, path, body, response, sending, sendError, history, historyLoading } =
  storeToRefs(rest)

const editor = ref<InstanceType<typeof MonacoEditor> | null>(null)

const methodOptions: { label: string; value: 'GET' | 'POST' | 'PUT' | 'DELETE' }[] = [
  { label: 'GET',    value: 'GET' },
  { label: 'POST',   value: 'POST' },
  { label: 'PUT',    value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
]

const filteredPaths = ref<string[]>([])
function searchPaths(event: { query: string }) {
  const q = (event.query || '').toLowerCase()
  filteredPaths.value = ES_PATHS.filter((p) => p.toLowerCase().includes(q)).slice(0, 30)
}

// History sidebar: filter input matches against method, path, or formatted time.
const historyFilter = ref('')
const filteredHistory = computed(() => {
  const q = historyFilter.value.trim().toLowerCase()
  if (!q) return history.value
  return history.value.filter((h) => {
    return (
      h.method.toLowerCase().includes(q) ||
      h.path.toLowerCase().includes(q) ||
      h.created_at.toLowerCase().includes(q)
    )
  })
})

const responseText = computed(() => {
  if (!response.value) return ''
  try {
    return JSON.stringify(response.value.body, null, 2)
  } catch {
    return String(response.value.body)
  }
})

const responseStatusSeverity = computed<'success' | 'warn' | 'danger' | 'secondary'>(() => {
  const s = response.value?.status ?? 0
  if (s >= 200 && s < 300) return 'success'
  if (s >= 400 && s < 500) return 'warn'
  if (s >= 500) return 'danger'
  return 'secondary'
})

function methodSeverity(m: string): 'info' | 'success' | 'warn' | 'danger' | 'secondary' {
  switch (m) {
    case 'GET':    return 'info'
    case 'POST':   return 'success'
    case 'PUT':    return 'warn'
    case 'DELETE': return 'danger'
    default:       return 'secondary'
  }
}

function formatHistoryTime(raw: string): string {
  // Backend stamps with a millisecond ISO-ish time; render relative.
  const ms = Date.parse(raw)
  if (isNaN(ms)) return raw
  const diff = Date.now() - ms
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`
  return new Date(ms).toLocaleDateString()
}

onMounted(() => rest.loadHistory())

async function send() {
  await rest.send()
  if (rest.response) await rest.loadHistory()
}

function format() {
  editor.value?.format()
}

async function copyCurl() {
  if (!connection.host) return
  try {
    await navigator.clipboard.writeText(rest.asCurl(connection.host))
    toast.add({ severity: 'success', summary: 'Copied', detail: 'curl command on clipboard', life: 2000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Copy failed', detail: 'Clipboard access denied', life: 3000 })
  }
}

const showHistory = ref(true)
</script>

<template>
  <main class="rest" :class="{ 'no-history': !showHistory }">
    <Toast position="bottom-right" />

    <aside v-if="showHistory" class="history-pane">
      <div class="history-head">
        <div class="history-title">
          <i class="pi pi-history" />
          <span>History</span>
          <Tag :value="String(history.length)" severity="secondary" />
        </div>
        <Button
          icon="pi pi-times"
          severity="secondary"
          text
          rounded
          size="small"
          @click="showHistory = false"
          title="Hide history pane"
        />
      </div>
      <div class="history-filter">
        <InputText
          v-model="historyFilter"
          placeholder="Filter history"
          size="small"
          fluid
        />
        <Button
          icon="pi pi-refresh"
          severity="secondary"
          text
          rounded
          size="small"
          :loading="historyLoading"
          @click="rest.loadHistory()"
          title="Reload history"
        />
      </div>

      <div class="history-list">
        <div v-if="!historyLoading && filteredHistory.length === 0" class="history-empty">
          <p v-if="history.length === 0">
            <i class="pi pi-info-circle" /> No requests yet. Send one and it'll appear here.
          </p>
          <p v-else>
            <i class="pi pi-search" /> No history matches "{{ historyFilter }}".
          </p>
        </div>
        <button
          v-for="(h, idx) in filteredHistory"
          :key="idx"
          class="history-item"
          :class="{ active: h.method === method && h.path === path }"
          @click="rest.loadFromHistory(h)"
          :title="`${h.method} ${h.path} · ${h.created_at}`"
        >
          <div class="history-line">
            <Tag :value="h.method" :severity="methodSeverity(h.method)" />
            <span class="history-path">{{ h.path }}</span>
          </div>
          <small class="history-time">{{ formatHistoryTime(h.created_at) }}</small>
        </button>
      </div>
    </aside>

    <div class="grid">
      <section class="request">
        <div class="line">
          <Button
            v-if="!showHistory"
            icon="pi pi-history"
            severity="secondary"
            outlined
            @click="showHistory = true"
            title="Show history"
          />
          <Select v-model="method" :options="methodOptions" option-label="label" option-value="value" style="width: 7rem" />
          <AutoComplete
            v-model="path"
            :suggestions="filteredPaths"
            placeholder="path (e.g. _search, myindex/_search)"
            class="path-input"
            style="flex: 1"
            :delay="80"
            @complete="searchPaths"
            @keyup.enter="send"
          />
          <Button icon="pi pi-bolt" label="Send" severity="primary" :loading="sending" @click="send" />
        </div>

        <div class="hint">
          <small>JSON syntax checked inline · <kbd>Ctrl/Cmd + Enter</kbd> sends · <kbd>Ctrl + Space</kbd> for editor suggestions</small>
        </div>

        <MonacoEditor
          ref="editor"
          v-model="body"
          language="json"
          height="540px"
          @submit="send"
        />

        <div class="actions">
          <Button icon="pi pi-clone" label="Copy as cURL" severity="secondary" outlined @click="copyCurl" />
          <Button icon="pi pi-align-left" label="Format" severity="secondary" outlined @click="format" />
        </div>
      </section>

      <section class="response">
        <div class="resp-header">
          <Tag
            v-if="response"
            :value="String(response.status)"
            :severity="responseStatusSeverity"
            rounded
          />
          <span v-else-if="sending" class="muted">Sending…</span>
          <span v-else class="muted">Response will appear here</span>
        </div>

        <Message v-if="sendError" severity="error" :closable="false">{{ sendError }}</Message>

        <MonacoEditor
          v-if="response"
          :model-value="responseText"
          language="json"
          read-only
          height="540px"
        />
        <div v-else class="empty" />
      </section>
    </div>
  </main>
</template>

<style scoped>
.rest {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 1.25rem;
  padding: 1rem 1.5rem 2rem;
  max-width: 1640px;
  margin: 0 auto;
}

.rest.no-history {
  grid-template-columns: minmax(0, 1fr);
}

.history-pane {
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  height: calc(100vh - 88px);
  position: sticky;
  top: 64px;
}

.history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.history-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
}

.history-filter {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.25rem;
}

.history-empty {
  padding: 1.5rem 1rem;
  color: #9ca3af;
  font-size: 0.8125rem;
  text-align: center;
}

.history-item {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.125rem;
  width: 100%;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 0.5rem 0.625rem;
  margin-bottom: 0.125rem;
  text-align: left;
  cursor: pointer;
  font: inherit;
}

.history-item:hover {
  background: #f3f4f6;
}

.history-item.active {
  background: rgba(99, 102, 241, 0.08);
  border-color: rgba(99, 102, 241, 0.25);
}

.history-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.history-path {
  font-family: ui-monospace, "Cascadia Mono", "Source Code Pro", monospace;
  font-size: 0.8125rem;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.history-time {
  color: #9ca3af;
  font-size: 0.6875rem;
  margin-left: 2.5rem;
}

.grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1.25rem;
}

.line {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
}

.path-input :deep(input) {
  font-family: ui-monospace, "Cascadia Mono", "Source Code Pro", monospace;
}

.hint {
  margin-bottom: 0.5rem;
  color: #6b7280;
}

kbd {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-bottom-width: 2px;
  border-radius: 4px;
  padding: 0 0.3em;
  font-family: ui-monospace, "Cascadia Mono", "Source Code Pro", monospace;
  font-size: 0.75rem;
  color: #374151;
}

.actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.resp-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
  min-height: 1.875rem;
}

.muted { color: #6b7280; }

.empty {
  height: 540px;
  border: 1px dashed #e5e7eb;
  border-radius: 6px;
}
</style>
