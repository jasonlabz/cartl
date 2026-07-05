import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/server/',
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/health-check': 'http://127.0.0.1:8080',
      '/cartl': 'http://127.0.0.1:8080'
    }
  }
})
