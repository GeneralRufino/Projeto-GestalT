import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Agrupa as bibliotecas do React
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
            return 'react';
          }
          // Agrupa os gráficos
          if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
            return 'charts';
          }
          // Agrupa o Bootstrap
          if (id.includes('bootstrap') || id.includes('react-bootstrap') || id.includes('bootstrap-icons')) {
            return 'bootstrap';
          }
        },
      },
    },
  },
})