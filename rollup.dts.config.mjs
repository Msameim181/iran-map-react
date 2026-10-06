import { dts } from 'rollup-plugin-dts'

// Bundles tsc's per-file declarations into one self-contained d.ts per entry, so the type files have no
// extensionless relative imports (which break node16/nodenext consumers of an ESM package).
export default ['index', 'full', 'lite', 'score-bands'].map((name) => ({
  input: `dist/types/${name}.d.ts`,
  output: { file: `dist/${name}.d.ts`, format: 'es' },
  external: [/^@msameim181\/iran-map-core(\/.*)?$/, 'react', 'react-tooltip'],
  plugins: [dts()],
}))
