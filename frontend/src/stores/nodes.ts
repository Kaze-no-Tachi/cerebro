import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useConnectionStore } from '@/stores/connection'
import { unwrap } from '@/services/api'
import type { NodeRow } from '@/types/nodes'

export const useNodesStore = defineStore('nodes', () => {
  const data = ref<NodeRow[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)

  async function load() {
    const connection = useConnectionStore()
    loading.value = true
    error.value = null
    try {
      data.value = await unwrap(connection.post<NodeRow[]>('/nodes'))
      lastUpdated.value = new Date()
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  function reset() {
    data.value = []
    error.value = null
    lastUpdated.value = null
  }

  return { data, loading, error, lastUpdated, load, reset }
})
