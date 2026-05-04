import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'
import { useConnectionStore } from '@/stores/connection'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/overview' },
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
    {
      path: '/nodes',
      name: 'nodes',
      component: () => import('@/views/NodesView.vue'),
      meta: { requiresConnection: true },
    },
    {
      path: '/rest',
      name: 'rest',
      component: () => import('@/views/RestView.vue'),
      meta: { requiresConnection: true },
    },
    {
      path: '/cat',
      name: 'cat',
      component: () => import('@/views/CatApiView.vue'),
      meta: { requiresConnection: true },
    },
  ],
})

router.beforeEach((to: RouteLocationNormalized) => {
  if (to.meta.requiresConnection && !useConnectionStore().connected) {
    return { path: '/connect' }
  }
  return true
})

export default router
