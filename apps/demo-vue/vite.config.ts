import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

// Check if we're building for GitHub Pages (using env variable)
const isGithubPages = process.env.GITHUB_PAGES === 'true';
const base = isGithubPages ? '/lazy-virtual-scroll/demo-vue/' : '/';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/demo-vue',
  base,

  server: {
    port: 4200,
    host: 'localhost',
  },

  preview: {
    port: 4300,
    host: 'localhost',
  },

  plugins: [vue(), nxViteTsPaths()],

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },

  build: {
    outDir: '../../dist/apps/demo-vue',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  }
});
