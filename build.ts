import {build} from 'tsdown';
import {rimraf} from 'rimraf';

await build({
  entry: ['src/**/*.ts'],
  dts: true,
  clean: true,
  sourcemap: false,
  target: 'esnext',
  format: ['esm', 'cjs'],
  outDir: './dist',
  unbundle: true,
  treeshake: true,
  unused: true,
});

await rimraf(['./dist/**/*.d.mts', './dist/**/*.d.cts'], {glob: true});
