import swc from 'unplugin-swc';
import {defineProject} from 'vitest/config';

export default defineProject({
  test: {
    globals: true,
    typecheck: {
      tsconfig: './tsconfig.json',
    },
  },
  plugins: [
    swc.vite({
      module: {type: 'es6'},
    }) as any,
  ],
});
