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
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        validation: resolve(__dirname, 'src/validation/index.ts'),
        encryption: resolve(__dirname, 'src/encryption/index.ts'),
        formatting: resolve(__dirname, 'src/formatting/index.ts'),
        datetime: resolve(__dirname, 'src/datetime/index.ts'),
        logger: resolve(__dirname, 'src/logger/index.ts'),
      },
      name: 'AbyssSharedUtils',
      formats: ['es', 'cjs'],
      fileName: (format, name) => `${name}.${format === 'es' ? 'esm' : format}.js`,
    },
    rollupOptions: {
      external: ['bcrypt', 'crypto-js', 'date-fns', 'joi', 'lodash', 'uuid', 'winston', 'zod'],
      output: {
        globals: {
          bcrypt: 'bcrypt',
          'crypto-js': 'CryptoJS',
          'date-fns': 'dateFns',
          joi: 'Joi',
          lodash: 'lodash',
          uuid: 'uuid',
          winston: 'winston',
          zod: 'zod',
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
