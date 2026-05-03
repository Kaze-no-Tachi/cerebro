import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'

export const useHostsStore = defineStore('hosts', () => {
  const hosts = ref<string[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      hosts.value = await api.get<string[]>('/connect/hosts')
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  return { hosts, loading, error, load }
})
