<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { useConnectionStore } from '@/stores/connection'
import { useOverviewStore } from '@/stores/overview'
import { useNodesStore } from '@/stores/nodes'

const router = useRouter()
const route = useRoute()
const connection = useConnectionStore()
const overview = useOverviewStore()
const nodes = useNodesStore()
const { host, username, connected } = storeToRefs(connection)

interface NavItem {
  label: string
  icon: string
  to: string
}

const navItems: NavItem[] = [
  { label: 'Overview', icon: 'pi pi-th-large', to: '/overview' },
  { label: 'Nodes',    icon: 'pi pi-server',   to: '/nodes' },
  { label: 'REST',     icon: 'pi pi-bolt',     to: '/rest' },
  { label: 'Cat APIs', icon: 'pi pi-list',     to: '/cat' },
]

// PrimeVue's status-tag color hint; small badge in the topbar that mirrors
// the cluster's health colour from the latest /overview poll.
const statusSeverity = computed<'success' | 'warn' | 'danger' | 'secondary'>(() => {
  switch (overview.data?.status) {
    case 'green':  return 'success'
    case 'yellow': return 'warn'
    case 'red':    return 'danger'
    default:       return 'secondary'
  }
})

function disconnect() {
  connection.clear()
  overview.reset()
  nodes.reset()
  router.push('/connect')
}

function isActive(target: string): boolean {
  return route.path === target
}
</script>

<template>
  <div class="app">
    <nav v-if="connected" class="topbar">
      <div class="brand">
        <span class="logo">cerebro</span>
        <span class="brand-badge">next</span>
      </div>

      <ul class="tabs">
        <li v-for="item in navItems" :key="item.to" :class="{ active: isActive(item.to) }">
          <RouterLink :to="item.to">
            <i :class="item.icon" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </li>
      </ul>

      <div class="connection">
        <Tag v-if="overview.data" :severity="statusSeverity" :value="overview.data.status" rounded />
        <code>{{ host }}</code>
        <span v-if="username" class="user">as {{ username }}</span>
        <Button
          label="Disconnect"
          icon="pi pi-sign-out"
          severity="secondary"
          size="small"
          text
          @click="disconnect"
        />
      </div>
    </nav>
    <RouterView />
  </div>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: stretch;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding-left: 1.25rem;
  padding-right: 1.25rem;
  height: 48px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-right: 1.5rem;
}

.logo {
  font-weight: 700;
  font-size: 1.0625rem;
  letter-spacing: -0.025em;
}

.brand-badge {
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.075em;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.12);
  padding: 0.125rem 0.375rem;
  border-radius: 999px;
}

.tabs {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  align-items: stretch;
}

.tabs li {
  display: flex;
  align-items: stretch;
}

.tabs a {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0 0.875rem;
  color: #4b5563;
  text-decoration: none;
  font-size: 0.875rem;
  border-bottom: 2px solid transparent;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.tabs a:hover {
  color: #111827;
}

.tabs li.active a {
  color: #6366f1;
  border-bottom-color: #6366f1;
  font-weight: 600;
}

.connection {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
  color: #6b7280;
  font-size: 0.875rem;
}

.user {
  font-style: italic;
}
</style>
