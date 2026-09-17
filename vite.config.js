import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';

export default defineConfig({
  base: './',
  resolve: {
    alias: [{
      find: '../vehicles/VehicleCatalog.js',
      replacement: fileURLToPath(new URL('./src/vehicles/IllustratedCatalogAdapter.js', import.meta.url))
    }]
  },
  build: {outDir: 'dist'}
});
