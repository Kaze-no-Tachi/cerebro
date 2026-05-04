<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import AutoComplete from 'primevue/autocomplete'
import Select from 'primevue/select'
import Button from 'primevue/button'
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

const { method, path, body, response, sending, sendError, history } = storeToRefs(rest)

const editor = ref<InstanceType<typeof MonacoEditor> | null>(null)

const methodOptions: { label: string; value: 'GET' | 'POST' | 'PUT' | 'DELETE' }[] = [
  { label: 'GET',    value: 'GET' },
  { label: 'POST',   value: 'POST' },
  { label: 'PUT',    value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
]

// AutoComplete filters its own list via the `complete` event; we honour the
// user's typed prefix and surface the curated list under it.
const filteredPaths = ref<string[]>([])

function searchPaths(event: { query: string }) {
  const q = (event.query || '').toLowerCase()
  filteredPaths.value = ES_PATHS.filter((p) => p.toLowerCase().includes(q)).slice(0, 30)
}

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
</script>

<template>
  <main class="rest">
    <Toast position="bottom-right" />

    <div class="grid">
      <section class="request">
        <div class="line">
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
          <small>JSON syntax checked inline · <kbd>Ctrl/Cmd + Enter</kbd> sends · type <kbd>Ctrl + Space</kbd> for editor suggestions</small>
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

        <details v-if="history.length" class="history">
          <summary><i class="pi pi-history" /> Previous requests <span class="muted">({{ history.length }})</span></summary>
          <ul>
            <li v-for="(h, idx) in history" :key="idx" @click="rest.loadFromHistory(h)">
              <span class="hist-time">{{ h.created_at }}</span>
              <Tag :value="h.method" severity="info" />
              <code>{{ h.path }}</code>
            </li>
          </ul>
        </details>
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
  padding: 1rem 1.5rem 2rem;
  max-width: 1480px;
  margin: 0 auto;
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

.history {
  margin-top: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
}

.history summary {
  cursor: pointer;
  user-select: none;
  font-size: 0.875rem;
  color: #374151;
}

.history ul {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0;
  max-height: 240px;
  overflow-y: auto;
}

.history li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  font-size: 0.8125rem;
}

.history li:hover {
  background: #f9fafb;
}

.hist-time {
  color: #9ca3af;
  font-variant-numeric: tabular-nums;
  width: 8.5rem;
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
