import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  root: 'example',
  plugins: [react()],
  resolve: {
    // Run the demo against the package sources, no build needed.
    alias: [
      { find: '@msameim181/iran-map-react/lite', replacement: resolve(__dirname, '../src/lite.ts') },
      { find: '@msameim181/iran-map-react/score-bands', replacement: resolve(__dirname, '../src/score-bands.ts') },
      {
        find: '@msameim181/iran-map-react/styles.css',
        replacement: resolve(__dirname, '../node_modules/@msameim181/iran-map-core/dist/styles.css'),
      },
      { find: '@msameim181/iran-map-react/full', replacement: resolve(__dirname, '../src/full.ts') },
      { find: /^@msameim181\/iran-map-react$/, replacement: resolve(__dirname, '../src/index.ts') },
    ],
  },
  build: {
    outDir: '../demo-dist',
    emptyOutDir: true,
  },
})
