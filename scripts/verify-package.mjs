// Packs the package, installs the tarball into a throwaway project and checks what consumers actually get:
// plain-Node ESM + CJS imports (no CSS loader), server rendering with the real package, NodeNext types,
// and the tree-shaken size of a catalog-free (ScoreBands only) bundle.
//
//   CORE_SPEC=../iran-map-core node scripts/verify-package.mjs     (local core link)
//   TARBALL=pkg.tgz node scripts/verify-package.mjs                (verify a pre-packed tarball)
//   REACT_VERSION=17 node scripts/verify-package.mjs               (default: whatever npm resolves, 18)
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const run = (command, args, cwd = root) => execFileSync(command, args, { cwd, stdio: 'pipe', encoding: 'utf8' })
const failures = []
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`)
  if (!ok) failures.push(name)
}

const work = mkdtempSync(join(tmpdir(), 'iran-map-react-verify-'))
try {
  // TARBALL: verify an already packed file (CI packs once and reuses it for every Node version).
  const tarball = process.env.TARBALL
    ? resolve(process.env.TARBALL)
    : join(work, run('npm', ['pack', '--pack-destination', work, '--silent']).trim().split('\n').pop())
  const reactVersion = process.env.REACT_VERSION ?? '18'
  const coreSpec =
    process.env.CORE_SPEC ??
    JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).dependencies['@msameim181/iran-map-core']
  const project = join(work, 'consumer')
  mkdirSync(project)
  const localCore = coreSpec.startsWith('.') ? resolve(root, coreSpec) : undefined
  // A local core must also satisfy the tarball's own dependency range, so override it.
  writeFileSync(
    join(project, 'package.json'),
    JSON.stringify({
      name: 'consumer',
      private: true,
      type: 'module',
      ...(localCore ? { overrides: { '@msameim181/iran-map-core': `file:${localCore}` } } : {}),
    }),
  )
  const specs = [
    tarball,
    `react@${reactVersion}`,
    `react-dom@${reactVersion}`,
    `@types/react@${reactVersion}`,
    'typescript@5.9',
    'esbuild',
  ]
  run('npm', ['install', '--no-audit', '--no-fund', '--ignore-scripts', ...specs], project)

  const node = (file, args = []) => run('node', [file, ...args], project)
  const entries = ['', '/full', '/lite', '/score-bands']

  // 1. Plain Node: ESM import and CJS require must not choke on CSS or ESM-only dependencies.
  writeFileSync(
    join(project, 'esm.mjs'),
    `${entries.map((e, i) => `import * as m${i} from '@msameim181/iran-map-react${e}'`).join('\n')}
${entries.map((_, i) => `if (!m${i}.ScoreBands) throw new Error('missing ScoreBands in entry ${i}')`).join('\n')}
if (!m0.IranMap || !m1.IranMap || !m2.IranMap) throw new Error('missing IranMap')
console.log('esm ok')`,
  )
  writeFileSync(
    join(project, 'cjs.cjs'),
    `const mods = ${JSON.stringify(entries)}.map((e) => require('@msameim181/iran-map-react' + e))
if (!mods.every((m) => m.ScoreBands)) throw new Error('missing ScoreBands')
console.log('cjs ok')`,
  )
  for (const file of ['esm.mjs', 'cjs.cjs']) {
    try {
      check(`node ${file}`, node(file).includes('ok'))
    } catch (error) {
      check(
        `node ${file}`,
        false,
        String(error.stderr ?? error)
          .split('\n')
          .slice(0, 3)
          .join(' | '),
      )
    }
  }

  // 2. The stylesheet export resolves.
  writeFileSync(
    join(project, 'css.cjs'),
    `const fs = require('node:fs'); const p = require.resolve('@msameim181/iran-map-react/styles.css'); console.log(fs.statSync(p).size > 1000 ? 'css ok' : 'css empty')`,
  )
  check('styles.css export', node('css.cjs').includes('css ok'))

  // 3. Server rendering with the real package (and real react-tooltip).
  writeFileSync(
    join(project, 'ssr.mjs'),
    `import { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { IranMap, ScoreBands } from '@msameim181/iran-map-react'
import { IranMap as Full } from '@msameim181/iran-map-react/full'
const lean = renderToString(h(IranMap, { data: { tehran: 1 }, tooltipId: 't' }))
const full = renderToString(h(Full, { data: {}, mode: 'county', tooltipId: 't' }))
const bands = renderToString(h(ScoreBands, { bands: [{ max: 5, color: '#fff' }] }))
if (!lean.includes('iran-map-province-tehran') || !full.includes('data-island-id') || !bands.includes('iran-score-bands')) throw new Error('bad html')
console.log('ssr ok')`,
  )
  try {
    check('server rendering', node('ssr.mjs').includes('ssr ok'))
  } catch (error) {
    check(
      'server rendering',
      false,
      String(error.stderr ?? error)
        .split('\n')
        .slice(0, 3)
        .join(' | '),
    )
  }

  // 4. Types under NodeNext, from an ES module and from a CommonJS file.
  const importLines = entries.map((e, i) => `import * as t${i} from '@msameim181/iran-map-react${e}'`).join('\n')
  writeFileSync(
    join(project, 'types.mts'),
    `${importLines}\nexport const x = [${entries.map((_, i) => `t${i}`).join(', ')}]\n`,
  )
  writeFileSync(
    join(project, 'types.cts'),
    `${entries.map((e, i) => `import t${i} = require('@msameim181/iran-map-react${e}')`).join('\n')}\nexport const x = [${entries.map((_, i) => `t${i}`).join(', ')}]\n`,
  )
  writeFileSync(
    join(project, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        module: 'nodenext',
        moduleResolution: 'nodenext',
        strict: true,
        noEmit: true,
        skipLibCheck: false,
        jsx: 'react',
        types: [],
      },
      include: ['types.mts', 'types.cts'],
    }),
  )
  try {
    run(join(project, 'node_modules/.bin/tsc'), ['-p', '.'], project)
    check('NodeNext types (ESM + CJS)', true)
  } catch (error) {
    check(
      'NodeNext types (ESM + CJS)',
      false,
      String(error.stdout ?? error)
        .split('\n')
        .slice(0, 4)
        .join(' | '),
    )
  }

  // 5. Bundle size: a ScoreBands-only bundle must not contain any map data, whatever the bundler.
  const bundle = (entryImport, name) => {
    writeFileSync(join(project, `${name}.js`), entryImport)
    run(
      join(project, 'node_modules/.bin/esbuild'),
      [
        `${name}.js`,
        '--bundle',
        '--minify',
        '--format=esm',
        '--define:process.env.NODE_ENV="production"',
        `--outfile=out-${name}.js`,
        '--log-level=error',
        '--external:react',
        '--external:react-dom',
        '--external:react-tooltip',
      ],
      project,
    )
    return readFileSync(join(project, `out-${name}.js`))
  }
  const bands = bundle(
    `import { ScoreBands } from '@msameim181/iran-map-react/score-bands'\nconsole.log(ScoreBands)`,
    'bands',
  )
  check('score-bands bundle has no map data', !bands.includes('razaviKhorasan'), `${gzipSync(bands).length} B gzip`)
  check('score-bands bundle is small', gzipSync(bands).length < 20_000)
  const rootBands = bundle(
    `import { ScoreBands } from '@msameim181/iran-map-react'\nconsole.log(ScoreBands)`,
    'rootbands',
  )
  check(
    'ScoreBands from the root entry tree-shakes the data',
    !rootBands.includes('razaviKhorasan'),
    `${gzipSync(rootBands).length} B gzip`,
  )
  const lean = bundle(`import { IranMap } from '@msameim181/iran-map-react'\nconsole.log(IranMap)`, 'lean')
  console.log(`info lean IranMap bundle (react external): ${gzipSync(lean).length} B gzip`)
} finally {
  rmSync(work, { recursive: true, force: true })
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed: ${failures.join(', ')}`)
  process.exit(1)
}
