import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useConnectionStore } from '@/stores/connection'
import { unwrap } from '@/services/api'
import type { ClusterOverview } from '@/types/overview'

export const useOverviewStore = defineStore('overview', () => {
  const data = ref<ClusterOverview | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)

  async function load() {
    const connection = useConnectionStore()
    loading.value = true
    error.value = null
    try {
      data.value = await unwrap(connection.post<ClusterOverview>('/overview'))
      lastUpdated.value = new Date()
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  function reset() {
    data.value = null
    error.value = null
    lastUpdated.value = null
  }

  return { data, loading, error, lastUpdated, load, reset }
})
