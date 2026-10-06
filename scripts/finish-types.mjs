// Emits .d.cts twins of the bundled declarations and removes tsc's intermediate files.
import { copyFileSync, rmSync } from 'node:fs'

for (const name of ['index', 'full', 'lite', 'score-bands']) copyFileSync(`dist/${name}.d.ts`, `dist/${name}.d.cts`)
rmSync('dist/types', { recursive: true, force: true })
