// `exports` cannot point into another package, so ship core's stylesheet as dist/styles.css.
import { copyFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'

const stylesheet = createRequire(import.meta.url).resolve('@msameim181/iran-map-core/styles.css')
mkdirSync('dist', { recursive: true })
copyFileSync(stylesheet, 'dist/styles.css')
