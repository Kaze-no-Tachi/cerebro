<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

import { api, ApiError, AuthRequiredError } from '@/services/api'
import { useHostsStore } from '@/stores/hosts'
import { useConnectionStore } from '@/stores/connection'

type Phase = 'idle' | 'connecting' | 'unauthorized'

const router = useRouter()
const hostsStore = useHostsStore()
const connection = useConnectionStore()
const { hosts, loading: loadingHosts, error: hostsError } = storeToRefs(hostsStore)

const phase = ref<Phase>('idle')
const host = ref('')
const username = ref('')
const password = ref('')
const feedback = ref<string | null>(null)

onMounted(() => hostsStore.load())

async function connect(target: string) {
  if (!target) return
  phase.value = 'connecting'
  feedback.value = null
  host.value = target
  try {
    const env = await api.post<unknown>('/connect', { host: target })
    handleConnectStatus(env.status, target)
  } catch (e) {
    handleConnectError(e, target)
  }
}

async function authorize() {
  if (!host.value || !username.value) return
  phase.value = 'connecting'
  feedback.value = null
  try {
    const env = await api.post<unknown>('/connect', {
      host: host.value,
      username: username.value,
      password: password.value,
    })
    handleAuthorizeStatus(env.status)
  } catch (e) {
    handleConnectError(e, host.value)
  }
}

function handleConnectStatus(status: number, target: string) {
  switch (status) {
    case 200:
      connection.setConnection(target)
      router.push('/overview')
      break
    case 401:
      phase.value = 'unauthorized'
      break
    default:
      phase.value = 'idle'
      feedback.value = `Unexpected response status: ${status}`
  }
}

function handleAuthorizeStatus(status: number) {
  switch (status) {
    case 200:
      connection.setConnection(host.value, username.value)
      router.push('/overview')
      break
    case 401:
      phase.value = 'unauthorized'
      feedback.value = 'Invalid username or password'
      break
    default:
      phase.value = 'idle'
      feedback.value = `Unexpected response status: ${status}`
  }
}

function handleConnectError(e: unknown, target: string) {
  phase.value = 'idle'
  if (e instanceof AuthRequiredError) {
    // /login is served by the Play backend, not the SPA; full-page navigate.
    window.location.href = '/login'
    return
  }
  if (e instanceof ApiError) {
    feedback.value = `Error connecting to ${target}: HTTP ${e.status}`
    return
  }
  feedback.value = `Error connecting to ${target}: ${(e as Error).message}`
}

function reset() {
  phase.value = 'idle'
  feedback.value = null
  username.value = ''
  password.value = ''
}
</script>

<template>
  <main class="connect">
    <header class="brand">
      <h1>cerebro</h1>
      <p class="subtitle">Elasticsearch &amp; OpenSearch admin</p>
    </header>

    <Card>
      <template #content>
        <div v-if="phase === 'connecting'" class="status">
          <ProgressSpinner style="width: 32px; height: 32px" />
          <span>Connecting to {{ host }}…</span>
        </div>

        <Message v-if="feedback" severity="error" :closable="false">
          {{ feedback }}
        </Message>

        <!-- IDLE: known clusters list + ad-hoc URL form -->
        <template v-if="phase === 'idle'">
          <section v-if="hosts.length > 0" class="known">
            <h3>Known clusters</h3>
            <ul>
              <li v-for="h in hosts" :key="h" @click="connect(h)" tabindex="0" @keyup.enter="connect(h)">
                {{ h }}
              </li>
            </ul>
          </section>

          <Message v-else-if="loadingHosts" severity="info" :closable="false">Loading known clusters…</Message>
          <Message v-else-if="hostsError" severity="warn" :closable="false">
            Could not load known clusters: {{ hostsError }}
          </Message>

          <section class="adhoc">
            <h3>Connect to a cluster</h3>
            <form @submit.prevent="connect(host)">
              <label for="host">Node address</label>
              <InputText
                id="host"
                v-model="host"
                placeholder="http://localhost:9200"
                fluid
                autocomplete="off"
              />
              <Button
                type="submit"
                label="Connect"
                icon="pi pi-arrow-right"
                :disabled="!host"
                style="margin-top: 0.75rem"
              />
            </form>
          </section>
        </template>

        <!-- UNAUTHORIZED: cluster requires Basic auth -->
        <template v-if="phase === 'unauthorized'">
          <section class="adhoc">
            <h3>Cluster requires authentication</h3>
            <p class="cluster-line">
              <code>{{ host }}</code>
            </p>
            <form @submit.prevent="authorize">
              <label for="username">Username</label>
              <InputText id="username" v-model="username" autocomplete="username" fluid />

              <label for="password" style="margin-top: 0.75rem">Password</label>
              <Password
                id="password"
                v-model="password"
                :feedback="false"
                toggle-mask
                autocomplete="current-password"
                fluid
              />

              <div class="auth-actions">
                <Button label="Cancel" severity="secondary" text @click="reset" />
                <Button
                  type="submit"
                  label="Authenticate"
                  icon="pi pi-sign-in"
                  :disabled="!username"
                />
              </div>
            </form>
          </section>
        </template>
      </template>
    </Card>
  </main>
</template>

<style scoped>
.connect {
  max-width: 420px;
  margin: 4rem auto;
  padding: 0 1rem;
}

.brand {
  text-align: center;
  margin-bottom: 1.5rem;
}

.brand h1 {
  margin: 0;
  font-size: 2rem;
  letter-spacing: -0.025em;
}

.subtitle {
  margin: 0.25rem 0 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

h3 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  font-weight: 600;
}

.known {
  margin-bottom: 1.5rem;
}

.known ul {
  list-style: none;
  padding: 0;
  margin: 0;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.known li {
  padding: 0.625rem 0.875rem;
  cursor: pointer;
  border-bottom: 1px solid #e5e7eb;
}

.known li:last-child {
  border-bottom: none;
}

.known li:hover,
.known li:focus {
  background-color: #f3f4f6;
  outline: none;
}

.adhoc form {
  display: flex;
  flex-direction: column;
}

.adhoc label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.cluster-line {
  margin: 0 0 1rem;
}

.auth-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}
</style>
