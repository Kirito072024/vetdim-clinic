import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // На GitHub Pages сайт живе за адресою /vetdim-clinic/ — шлях передається змінною BASE_PATH у CI
  base: process.env.BASE_PATH || '/',
  server: {
    port: 5173,
    // Запити /api у режимі розробки йдуть на Express-сервер
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
