import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'
import { useConnectionStore } from '@/stores/connection'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/connect' },
    {
      path: '/connect',
      name: 'connect',
      component: () => import('@/views/ConnectView.vue'),
    },
    {
      path: '/overview',
      name: 'overview',
      component: () => import('@/views/OverviewView.vue'),
      meta: { requiresConnection: true },
    },
  ],
})

// Routes flagged with `requiresConnection` redirect to /connect when no
// cluster has been chosen yet.
router.beforeEach((to: RouteLocationNormalized) => {
  if (to.meta.requiresConnection && !useConnectionStore().connected) {
    return { path: '/connect' }
  }
  return true
})

export default router
