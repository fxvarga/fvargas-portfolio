import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    // Handle SPA routing in dev mode
    historyApiFallback: true,
  },
  build: {
    outDir: 'dist',
  },
  // For production preview
  preview: {
    port: 3001,
  },
})
