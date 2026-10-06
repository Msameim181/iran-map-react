import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

// Same tests as a consumer would run, but against the built dist instead of the sources.
export default defineConfig({
  resolve: {
    alias: [
      { find: '@msameim181/iran-map-react/full', replacement: resolve(__dirname, 'dist/full.js') },
      { find: '@msameim181/iran-map-react/lite', replacement: resolve(__dirname, 'dist/lite.js') },
      { find: '@msameim181/iran-map-react/score-bands', replacement: resolve(__dirname, 'dist/score-bands.js') },
      { find: /^@msameim181\/iran-map-react$/, replacement: resolve(__dirname, 'dist/index.js') },
    ],
  },
  esbuild: { jsx: 'transform', jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment' },
  test: {
    environment: 'jsdom',
    include: ['tests-dist/**/*.test.{ts,tsx}'],
    testTimeout: 30_000,
    server: { deps: { inline: [/@msameim181\/iran-map-react/] } },
  },
})
