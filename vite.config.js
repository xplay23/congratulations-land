import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  // Use a dedicated cache served through the dev server's node_modules route.
  cacheDir: 'node_modules/.cache/videovitannya-vite',
  // Audit HTML in tmp/ is output, not an application entry point.
  optimizeDeps: {
    entries: ['src/entry-client.js'],
    include: ['vue', '@phosphor-icons/vue']
  },
  build: { outDir: 'dist', emptyOutDir: true },
  server: {
    host: '127.0.0.1',
    watch: { ignored: ['**/tmp/**', '**/test-results/**', '**/dist/**', '**/.server/**'] }
  }
});
