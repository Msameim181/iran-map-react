# Agent guide

## Package and layout

`@msameim181/iran-map-react` is the React SVG renderer for Iran provinces, counties, regions, capitals, islands, and seas. `@msameim181/iran-map-core` supplies framework-free data and logic; `@msameim181/iran-map-vue` is the Vue counterpart. Read README.md, CHANGELOG.md, package.json, relevant source, and tests before changing behavior or documenting an API.

- `src/index.ts`: lean root entry (provinces and province capitals).
- `src/full.ts`, `src/lite.ts`: maps bound to full and lite catalogs.
- `src/score-bands.ts`: catalog-free ScoreBands entry.
- `src/components/`: map state/events, SVG rendering, memoized parts, and ScoreBands.
- `src/keyboard.ts`, `src/instanceId.ts`, `src/useIsomorphicLayoutEffect.ts`: keyboard and SSR helpers.
- `tests/`: source tests; `tests-dist/`: built-package tests with real react-tooltip.
- `scripts/`: stylesheet copying, declaration finishing, and packed-consumer checks.
- `example/`: Vite demo, with root `example` and build output `demo-dist/`.
- `example/public/llms.txt`: public copy of root llms.txt; keep them identical.
- `.github/workflows/`: CI, demo deployment, and releases.
- `dist/`: generated ESM/CJS, declarations, and stylesheet; do not edit by hand.
- `NOTICE`, `LICENSE`: data attribution and application license.

## Commands

Run from the repository root. CI uses Node.js 22; package consumers require Node.js 18+.

```bash
npm ci --ignore-scripts
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
npm run lint:package
npm run test:dist
npm run verify:package
```

`npm test` runs Vitest source tests. `npm run test:watch` runs watch mode. Build before `lint:package`, `test:dist`, and `verify:package`. Package lint runs publint and are-the-types-wrong; package verification packs and installs into a scratch consumer, then checks ESM/CJS imports, stylesheet resolution, SSR, NodeNext types, and tree-shaking. Verification needs registry access.

```bash
npm run demo
npm run demo:build -- --base /iran-map-react/
```

## Conventions and checks

- Use Conventional Commits, such as `fix: ...`, `docs: ...`, or `build: ...`.
- No code changes without tests. Add or update regression tests for behavior changes and run relevant tests; complete the CI checks above before proposing a code change.
- Follow the existing TypeScript and React patterns. Prettier uses two-space indentation, single quotes, no semicolons, trailing commas, and single-quoted JSX attributes.
- Keep handlers and model inputs stable; preserve keyboard interaction, accessible labels, SSR behavior, and explicit CSS loading.
- Verify entry points against the package.json export map. Keep catalogs in core rather than duplicating geometry here.
- Keep README examples and both llms.txt copies consistent with tested exports and props. Preserve data attribution.
- Use pull requests for changes; do not push changes directly to main. Never commit tokens or credentials.

## Release process

Prepare version and CHANGELOG changes through a pull request and merge to main. A `vX.Y.Z` tag triggers `.github/workflows/release.yml`; the tagged commit must be on main and the tag must match package.json's version. The workflow rejects local file links and runs lint, formatting, types, tests, build, package lint, dist tests, and packed-consumer verification.

The verified tarball is published to GitHub Packages using the workflow's `GITHUB_TOKEN`. npmjs publishing uses OIDC trusted publishing with `--provenance`, conditional on repository variable `NPM_PUBLISH=true` and configured npm trusted publishing; it uses no stored npm token. A GitHub Release takes its notes from the matching CHANGELOG section. Prereleases use the `next` dist-tag; stable releases use `latest`. Existing registry versions and GitHub Releases are skipped on reruns. Never commit tokens; release tagging and publishing require an explicit release request.

## For agents that USE this package

Install from npmjs.com without a token:

```bash
npm install @msameim181/iran-map-react
```

Requires React and react-dom 16.14+ and Node.js 18+.

```tsx
import React from 'react'
import { IranMap } from '@msameim181/iran-map-react'
import '@msameim181/iran-map-react/styles.css'

const provinceData = { tehran: 55 }

export function ProvinceMap() {
  return <IranMap data={provinceData} mode='province' capitalMarkers='province' />
}
```

- Import `styles.css` explicitly once in the app; JavaScript does not load it. It also styles ScoreBands.
- The root entry lacks county, county-capital, island, and sea catalogs. Use `/full`, `/lite`, or `catalogs` for those features; missing catalogs skip features and warn once in development. `catalogs` merges field by field with entry defaults.
- Standard and mini presets live in core. Supply them through `catalogs` or bind them with `createIranMap`. Use `/score-bands` for a legend/editor without map data.
- Keep array/object inputs (`data`, `regions`, `detailedCounties`, `colorBands`, catalog fields) referentially stable using module constants or `useMemo`.
- County IDs are qualified, for example `razaviKhorasan.mashhad`. A missing key, `null`, `undefined`, `-1`, or a non-finite number means no data; zero is valid. Color-band `min` is inclusive and `max` exclusive.
- The built entries include `'use client'` and support server rendering without a DOM. React 18+ uses hydration-safe `useId`; under React < 18, pass a stable `tooltipId`. Load CSS through the app's stylesheet pipeline.
- With asynchronously loaded catalogs, render the map after catalogs are ready: a default selection absent at mount is dropped. Capital markers become keyboard buttons only with `onCapitalSelect`.
