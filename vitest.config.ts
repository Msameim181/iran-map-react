import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: [
      { find: '@msameim181/iran-map-react/lite', replacement: resolve(__dirname, 'src/lite.ts') },
      { find: '@msameim181/iran-map-react/score-bands', replacement: resolve(__dirname, 'src/score-bands.ts') },
      { find: '@msameim181/iran-map-react/full', replacement: resolve(__dirname, 'src/full.ts') },
      { find: /^@msameim181\/iran-map-react$/, replacement: resolve(__dirname, 'src/index.ts') },
    ],
  },
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
