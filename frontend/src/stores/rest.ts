import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useConnectionStore } from '@/stores/connection'
import { unwrap } from '@/services/api'
import type { RestHistoryEntry, RestMethod, RestResponse } from '@/types/rest'

export const useRestStore = defineStore('rest', () => {
  const method = ref<RestMethod>('GET')
  const path = ref<string>('_search')
  const body = ref<string>('{\n  "query": {\n    "match_all": {}\n  }\n}\n')

  const response = ref<RestResponse | null>(null)
  const sending = ref(false)
  const sendError = ref<string | null>(null)

  const history = ref<RestHistoryEntry[]>([])
  const historyLoading = ref(false)

  async function send() {
    const connection = useConnectionStore()
    sending.value = true
    sendError.value = null
    response.value = null
    try {
      // POST /rest/request expects { method, path, data? }. The backend
      // controller treats a missing/null `data` as "no body" — useful for
      // bare GET / DELETE requests (e.g. _cat/indices, _cluster/health)
      // that should not carry a stale match_all payload from the editor.
      const payload: Record<string, unknown> = {
        method: method.value,
        path: path.value,
      }
      if (body.value.trim().length > 0) payload.data = body.value
      const env = await connection.post<unknown>('/rest/request', payload)
      response.value = { status: env.status, body: env.body }
    } catch (e) {
      sendError.value = (e as Error).message
    } finally {
      sending.value = false
    }
  }

  async function loadHistory() {
    const connection = useConnectionStore()
    historyLoading.value = true
    try {
      history.value = await unwrap(connection.post<RestHistoryEntry[]>('/rest/history'))
    } catch {
      history.value = []
    } finally {
      historyLoading.value = false
    }
  }

  function loadFromHistory(entry: RestHistoryEntry) {
    method.value = entry.method
    path.value = entry.path
    if (typeof entry.body === 'string' && entry.body.length > 0) {
      body.value = entry.body
    }
  }

  // Builds the equivalent curl invocation the user can paste into a shell.
  function asCurl(host: string): string {
    const url = `${host.replace(/\/+$/, '')}/${path.value.replace(/^\//, '')}`
    const parts = ['curl', '-X', method.value, `'${url}'`]
    if (method.value !== 'GET' && method.value !== 'DELETE' && body.value.trim()) {
      parts.push("-H 'Content-Type: application/json'")
      parts.push(`-d '${body.value.replace(/'/g, "'\\''")}'`)
    }
    return parts.join(' ')
  }

  return {
    method,
    path,
    body,
    response,
    sending,
    sendError,
    history,
    historyLoading,
    send,
    loadHistory,
    loadFromHistory,
    asCurl,
  }
})
