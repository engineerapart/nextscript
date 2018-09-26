import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import sourceMaps from 'rollup-plugin-sourcemaps';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';

const pkg = require('./package.json'); // tslint:disable-line no-var-requires

// This is how to do this the right way:
// https://github.com/bvaughn/react-window/blob/master/rollup.config.js
const input = 'src/index.ts';
const external = ['react', 'terser', 'prop-types', 'htmlescape'];
const watch = { include: 'src/**' };

export default [{
  input,
  output: { file: pkg.main, format: 'cjs' },
  // Indicate here external modules you don't want to include in your bundle (i.e.: 'lodash')
  // These must be installed by the library consumer - specify them in 'dependencies' or 'peerDependencies'
  // In the case of Next, these are already installed, so there's no additional work.
  external,
  watch,
  plugins: [
    // Allow node_modules resolution, so you can use 'external' to control
    // which external modules to include in the bundle
    // https://github.com/rollup/rollup-plugin-node-resolve#usage
    resolve(),
    // Compile TypeScript files
    typescript({ useTsconfigDeclarationDir: true }),
    // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
    commonjs(),
    // uglify
    terser({ warnings: true, safari10: true }),
    // Resolve source maps to the original source
    sourceMaps(),
  ],
}, {
  input,
  output: { file: pkg.module, format: 'esm', sourcemap: true },
  // Indicate here external modules you don't want to include in your bundle (i.e.: 'lodash')
  // These must be installed by the library consumer - specify them in 'dependencies' or 'peerDependencies'
  // In the case of Next, these are already installed, so there's no additional work.
  external,
  watch,
  plugins: [
    // Allow node_modules resolution, so you can use 'external' to control
    // which external modules to include in the bundle
    // https://github.com/rollup/rollup-plugin-node-resolve#usage
    resolve(),
    // Compile TypeScript files
    typescript({ useTsconfigDeclarationDir: true }),
    // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
    commonjs(),
    // uglify
    terser({ warnings: true, safari10: true }),
    // Resolve source maps to the original source
    sourceMaps(),
  ],
}];
