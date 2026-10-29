import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Konfigurasi dasar Vite untuk aplikasi Vue.
// Port dibuat tetap agar alamat localhost mudah diingat saat pengembangan.
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    strictPort: true,
  },
})
