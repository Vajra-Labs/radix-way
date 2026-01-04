import {defineConfig} from 'tsdown';

export default defineConfig({
  dts: true,
  clean: true,
  sourcemap: false,
  entry: 'src/index.ts',
  format: ['esm', 'cjs'],
  outDir: './dist',
  treeshake: true,
});
