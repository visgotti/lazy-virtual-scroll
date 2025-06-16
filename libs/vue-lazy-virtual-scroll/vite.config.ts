import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import * as path from 'path';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { copyFileSync } from 'fs';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/lazy-virtual-scroll-vue',

  plugins: [
    vue(),
    nxViteTsPaths(),
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(__dirname, 'tsconfig.lib.json'),
    }),
    {
      name: 'copy-readme',
      closeBundle() {
        const readmePath = path.join(__dirname, 'README.md');
        const outDir = '../../dist/libs/vue-lazy-virtual-scroll';
        const destPath = path.join(__dirname, outDir, 'README.md');
        copyFileSync(readmePath, destPath);
        console.log(`✅ Copied README.md to ${outDir}`);
      }
    }
  ],

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },

  // Configuration for building your library.
  // See: https://vitejs.dev/guide/build.html#library-mode
  build: {
    outDir: '../../dist/libs/vue-lazy-virtual-scroll',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      // Could also be a dictionary or array of multiple entry points.
      entry: 'src/index.ts',
      name: '@lazy-virtual-scroll/vue',
      fileName: 'index',
      // Change this to the formats you want to support.
      // Don't forget to update your package.json as well.
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: ['vue'],
      // Make sure @core is not treated as external
      // so it gets bundled with the output
      output: {
        preserveModules: false, // This ensures everything gets bundled together
      }
    },
  }
});
