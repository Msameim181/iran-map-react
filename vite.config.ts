import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// Library build. Classic JSX runtime (jsx: "react" in tsconfig) keeps the output usable on React >=16.8,
// where `react/jsx-runtime` does not exist. Everything a consumer already installs is external.
export default defineConfig({
  esbuild: { jsx: 'transform', jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment' },
  build: {
    target: 'es2019',
    sourcemap: true,
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react-tooltip', /^@msameim181\/iran-map-core(\/.*)?$/],
    },
  },
})
