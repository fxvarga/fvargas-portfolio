import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Baked-in build identifier surfaced in the voice orb's diagnostic panel.
  // Lets us verify at a glance whether the browser is running the latest
  // bundle (iOS Safari is aggressive about caching index.html).
  define: {
    __BUILD_ID__: JSON.stringify(new Date().toISOString()),
  },
  build: {
    sourcemap: true,
    minify: false,
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:5200',
        changeOrigin: true,
      },
      '/hubs': {
        target: 'http://localhost:5200',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
