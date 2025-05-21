import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/dashboard-summary': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/parties': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/forces-faiblesses': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./src/styles/variables.scss";`,
      },
    },
  },
});