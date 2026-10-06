import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: { '@msameim181/iran-map-react': resolve(__dirname, 'src/index.ts') } },
  esbuild: { jsx: 'transform', jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment' },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    css: false,
    setupFiles: ['./vitest.setup.ts'],
    // Large catalogs make the first import slow.
    testTimeout: 30_000,
  },
})
