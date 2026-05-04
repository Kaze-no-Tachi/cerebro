import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { api } from '@/services/api'

const STORAGE_KEY = 'cerebro:connection'

interface PersistedConnection {
  host: string
  username: string | null
}

function loadPersisted(): PersistedConnection | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PersistedConnection>
    if (typeof parsed.host !== 'string' || !parsed.host) return null
    return {
      host: parsed.host,
      username: typeof parsed.username === 'string' ? parsed.username : null,
    }
  } catch {
    return null
  }
}

// Deep-link support: ?host=http%3A%2F%2Fes8%3A9200 in any /next/* URL
// pre-selects the cluster, matching the legacy cerebro `?host=...` pattern.
// Takes precedence over whatever's in localStorage.
function loadFromUrl(): PersistedConnection | null {
  try {
    const params = new URLSearchParams(window.location.search)
    const h = params.get('host')
    if (!h) return null
    return { host: h, username: null }
  } catch {
    return null
  }
}

// Tracks the cluster cerebro is currently connected to. The host string is
// what every subsequent API call must include in its body so the Play backend
// knows which Elasticsearch / OpenSearch cluster to forward to.
//
// Host + username are persisted to localStorage so a browser refresh keeps
// you on the dashboard. Password is intentionally NOT persisted — if the
// cluster requires auth, the next API call will 401 and the app routes back
// to /connect for re-entry. Same security trade-off as the legacy AngularJS
// app (which kept everything in memory and re-prompted on refresh).
export const useConnectionStore = defineStore('connection', () => {
  const initial = loadFromUrl() ?? loadPersisted()

  const host = ref<string | null>(initial?.host ?? null)
  const username = ref<string | null>(initial?.username ?? null)

  const connected = computed(() => host.value !== null)

  function setConnection(h: string, u?: string | null) {
    host.value = h
    username.value = u ?? null
  }

  function clear() {
    host.value = null
    username.value = null
  }

  // Mirror the host/username refs into localStorage on every change.
  watch(
    [host, username],
    ([h, u]) => {
      try {
        if (h) {
          window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ host: h, username: u } satisfies PersistedConnection),
          )
        } else {
          window.localStorage.removeItem(STORAGE_KEY)
        }
      } catch {
        // Private browsing / quota exceeded — ignore. State is still in memory.
      }
    },
    { flush: 'post' },
  )

  // Helper for view stores: POST a body that always includes the current host.
  async function post<T>(path: string, body: Record<string, unknown> = {}) {
    if (!host.value) throw new Error('Not connected to any host')
    return api.post<T>(path, { host: host.value, ...body })
  }

  return { host, username, connected, setConnection, clear, post }
})
