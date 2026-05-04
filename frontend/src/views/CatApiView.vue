<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import Select from 'primevue/select'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

import { CAT_APIS, useCatStore } from '@/stores/cat'

const cat = useCatStore()
const { api, rows, loading, error } = storeToRefs(cat)

const apiOptions = computed(() => CAT_APIS.map((a) => ({ label: a, value: a })))

const columns = computed<string[]>(() => {
  if (rows.value.length === 0) return []
  // The first row carries the union of fields the cat API returns; fall back
  // to merging across rows for robustness.
  const seen = new Set<string>()
  for (const row of rows.value) {
    for (const k of Object.keys(row)) seen.add(k)
  }
  return [...seen]
})

function execute() {
  cat.execute(api.value)
}
</script>

<template>
  <main class="cat">
    <header class="header">
      <h1>Cat APIs</h1>
      <small>direct read access to the cluster's <code>_cat/*</code> endpoints</small>
    </header>

    <div class="controls">
      <Select v-model="api" :options="apiOptions" option-label="label" option-value="value" placeholder="Choose an API" style="min-width: 14rem" />
      <Button label="Execute" icon="pi pi-play" :loading="loading" @click="execute" />
      <code class="endpoint">_cat/{{ api.replace(' ', '_') }}</code>
    </div>

    <ProgressSpinner v-if="loading && rows.length === 0" style="display: block; margin: 4rem auto" />

    <Message v-else-if="error" severity="error" :closable="false">{{ error }}</Message>

    <Message v-else-if="!loading && rows.length === 0 && !error" severity="info" :closable="false">
      Pick a Cat API and click Execute. Results populate here.
    </Message>

    <DataTable
      v-else-if="rows.length > 0"
      :value="rows"
      striped-rows
      size="small"
      sort-mode="single"
      :paginator="rows.length > 25"
      :rows="25"
      :rows-per-page-options="[25, 50, 100]"
    >
      <Column v-for="col in columns" :key="col" :field="col" :header="col" sortable />
    </DataTable>
  </main>
</template>

<style scoped>
.cat {
  padding: 1rem 1.5rem 2rem;
  max-width: 1280px;
  margin: 0 auto;
}

.header h1 {
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
  letter-spacing: -0.025em;
}

.header small { color: #6b7280; }

.controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1rem 0 1rem;
  flex-wrap: wrap;
}

.endpoint {
  margin-left: auto;
  font-size: 0.8125rem;
  color: #6b7280;
}
</style>
