import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/.netlify/functions/chat': {
        target: 'http://localhost:9898',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('react-markdown') ||
            id.includes('remark-gfm') ||
            id.includes('rehype-highlight') ||
            id.includes('highlight.js')
          ) {
            return 'preview-vendor'
          }
        },
      },
    },
  },
})
