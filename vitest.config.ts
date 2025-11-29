import swc from 'unplugin-swc';
import {defineProject} from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineProject({
  test: {
    globals: true,
    typecheck: {
      tsconfig: './tsconfig.json',
    },
  },
  plugins: [
    tsconfigPaths(),
    swc.vite({
      module: {type: 'es6'},
    }) as any,
  ],
});
