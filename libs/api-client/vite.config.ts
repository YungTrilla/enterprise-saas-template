import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'AbyssAPIClient',
      formats: ['es', 'cjs'],
      fileName: format => `index.${format === 'es' ? 'esm' : format}.js`,
    },
    rollupOptions: {
      external: ['axios', 'qs'],
      output: {
        globals: {
          axios: 'axios',
          qs: 'qs',
        },
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
