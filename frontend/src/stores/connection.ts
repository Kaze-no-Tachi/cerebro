import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/services/api'

// Tracks the cluster cerebro is currently connected to. The host string is
// what every subsequent API call must include in its body so the Play backend
// knows which Elasticsearch / OpenSearch cluster to forward to.
export const useConnectionStore = defineStore('connection', () => {
  const host = ref<string | null>(null)
  const username = ref<string | null>(null)

  const connected = computed(() => host.value !== null)

  function setConnection(h: string, u?: string | null) {
    host.value = h
    username.value = u ?? null
  }

  function clear() {
    host.value = null
    username.value = null
  }

  // Helper for view stores: POST a body that always includes the current host.
  async function post<T>(path: string, body: Record<string, unknown> = {}) {
    if (!host.value) throw new Error('Not connected to any host')
    return api.post<T>(path, { host: host.value, ...body })
  }

  return { host, username, connected, setConnection, clear, post }
})
