import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useConnectionStore } from '@/stores/connection'

// All cat APIs the legacy cerebro UI exposed. Names with spaces are sent to
// the backend with the space replaced by `_` to match Elasticsearch's URL
// segments (e.g. `pending_tasks`, `thread_pool`).
export const CAT_APIS = [
  'aliases',
  'allocation',
  'count',
  'fielddata',
  'health',
  'indices',
  'master',
  'nodeattrs',
  'nodes',
  'pending tasks',
  'plugins',
  'recovery',
  'repositories',
  'thread pool',
  'shards',
  'segments',
] as const

export type CatRow = Record<string, string>

export const useCatStore = defineStore('cat', () => {
  const api = ref<string>('indices')
  const rows = ref<CatRow[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function execute(name: string) {
    const connection = useConnectionStore()
    api.value = name
    loading.value = true
    error.value = null
    rows.value = []
    try {
      const apiSegment = name.replace(/ /g, '_')
      const env = await connection.post<CatRow[] | { error: unknown }>('/cat', { api: apiSegment })
      if (env.status >= 200 && env.status < 300 && Array.isArray(env.body)) {
        rows.value = env.body
      } else {
        error.value =
          typeof env.body === 'object' && env.body !== null && 'error' in env.body
            ? JSON.stringify((env.body as { error: unknown }).error)
            : `Cat API failed with status ${env.status}`
      }
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  return { api, rows, loading, error, execute }
})
