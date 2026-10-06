import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  root: 'example',
  plugins: [react()],
  resolve: {
    // Run the demo against the package sources, no build needed.
    alias: { '@msameim181/iran-map-react': resolve(__dirname, '../src/index.ts') },
  },
  build: {
    outDir: '../demo-dist',
    emptyOutDir: true,
  },
})
