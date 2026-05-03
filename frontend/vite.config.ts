import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// The new SPA mounts at /next so it can run alongside the legacy AngularJS UI
// served from /. Once parity is reached we'll swap defaults and remove this.
const SPA_BASE = '/next/'

// Backend API paths the Vite dev server should proxy to Play at :9000.
// Mirrors the modules listed in docs/api.md.
const API_PATTERN =
  '^/(connect|overview|cluster_changes|cluster|nodes|rest|index_metadata|create_index|templates|aliases|snapshot|repository|analysis|auth|login|logout|navbar)(/.*)?$'

export default defineConfig({
  base: SPA_BASE,
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      [API_PATTERN]: {
        target: 'http://localhost:9000',
        changeOrigin: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
