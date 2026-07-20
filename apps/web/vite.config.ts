import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@aet-hub/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  server: {
    port: 5173,
  },
  envDir: path.resolve(__dirname, '../..'),
});
