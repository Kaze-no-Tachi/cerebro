<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { RouterView, useRouter } from 'vue-router'
import Button from 'primevue/button'
import { useConnectionStore } from '@/stores/connection'
import { useOverviewStore } from '@/stores/overview'

const router = useRouter()
const connection = useConnectionStore()
const overview = useOverviewStore()
const { host, username, connected } = storeToRefs(connection)

function disconnect() {
  connection.clear()
  overview.reset()
  router.push('/connect')
}
</script>

<template>
  <div class="app">
    <nav v-if="connected" class="topbar">
      <div class="brand">
        <span class="logo">cerebro</span>
        <span class="badge">next</span>
      </div>
      <div class="connection">
        <i class="pi pi-server" />
        <code>{{ host }}</code>
        <span v-if="username" class="user">as {{ username }}</span>
      </div>
      <Button
        label="Disconnect"
        icon="pi pi-sign-out"
        severity="secondary"
        size="small"
        text
        @click="disconnect"
      />
    </nav>
    <RouterView />
  </div>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.brand {
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
}

.logo {
  font-weight: 700;
  font-size: 1.125rem;
  letter-spacing: -0.025em;
}

.badge {
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.075em;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.12);
  padding: 0.125rem 0.375rem;
  border-radius: 999px;
}

.connection {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  color: #6b7280;
  font-size: 0.875rem;
}

.user {
  font-style: italic;
}
</style>
