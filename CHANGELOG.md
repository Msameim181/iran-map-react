# Changelog

## 0.2.2 - 2026-10-06

Documentation and metadata only; no code changes.

### Changed

- README: new opening with a one-line summary, install and a ten-line usage example, a comparison with the original `react-iran-map` and with raw GeoJSON/OSM files, the package family, and a Persian summary line. The previous content follows unchanged.
- `llms.txt` (llmstxt.org format), also served at the root of the demo site, and `AGENTS.md` (repository guide for contributor agents, plus a section for agents that use the package).
- `package.json`: `description` and `keywords` for discoverability.

## 0.2.1 - 2026-10-06

### Changed

- Documentation: the install instructions now describe npmjs.com as the primary registry (no `.npmrc` or token needed); GitHub Packages is documented as the alternative.
- Release pipeline: the first release published to npmjs.com through trusted publishing (OIDC, with provenance). No code changes.

## 0.2.0

### Breaking changes (0.x)

- **The stylesheet is no longer imported from JavaScript.** Add `import '@msameim181/iran-map-react/styles.css'` once in your app. In exchange the package loads in Node, server rendering, Jest and Vitest, which 0.1.x did not (`ERR_UNKNOWN_FILE_EXTENSION` on `.css`).
- Peer dependencies are now `react >=16.14` and `react-dom >=16.14` (the real floor, set by `react-tooltip` 5).
- `catalogs` now merges field by field with the entry's defaults instead of replacing them.
- Space activates a focused area, island or capital on key release (like a native button) and ignores key repeat; Enter still activates on press.
- The `<svg>` is `role='group'` instead of `role='img'`, so the buttons inside it are reachable; capital markers without `onCapitalSelect` are no longer focusable buttons.

### Added

- `@msameim181/iran-map-react/lite` (every catalog at core's lite level) and a catalog-free `@msameim181/iran-map-react/score-bands` entry.
- `tooltip`, `tooltipId` (reduced to word characters and hyphens) and `tooltipDisableStyleInjection` props. Each map has its own tooltip id; keyboard focus pins the tooltip below the element; Escape closes it; the tooltip uses `position: fixed` so the map's `overflow: hidden` no longer clips it.
- Escape clears the selection. When the selected area leaves the map, the selection is cleared and `onDeselect` fires once.
- `'use client'` on every entry; `/*#__PURE__*/` annotations so unused entries tree-shake in esbuild and webpack (a ScoreBands-only bundle was 478 kB gzip with esbuild in 0.1.0, ~2 kB now).
- Demo: "Data level" selector (Full / Standard / Lite / Mini) that loads core's presets on demand.
- CI: Node 18/20/22 and React 16.14/17/18/19 consumer matrix on the packed tarball, publint, are-the-types-wrong, SSR with the real package, axe, StrictMode and SSR tests.

### Fixed

- `ScoreBands` no longer commits every intermediate keystroke (typing `-5` used to briefly make a bound unbounded). Typed text is a draft committed on blur or Enter; removing a band keeps the other bands' drafts, and partial text such as `-` (a number input reporting `badInput`) is never recorded as a blank, unbounded draft. Closes #1.
- Focus ring on areas (from core 0.2.0's stylesheet) so keyboard focus is visible.

### Changed

- The root entry binds core's `./lean` preset; the tooltip id comes from core's `getTooltipId`.
- "Add band" appends an open-ended band starting at the display minimum.
- Selection changes re-render only the previous and the newly selected area: area, island and capital-marker components are memoized and the handlers read the selection through a ref, so their identity never changes (a test counts renders). County-mode select ~30 ms -> ~20 ms in the demo (3,160 SVG nodes).
- Callback props are read through a ref written in a layout effect (concurrent-render safe).
- Installation is from npmjs.com (trusted publishing with provenance); GitHub Packages receives the same tarball.

## 0.1.0

First release of `@msameim181/iran-map-react`, split out of the single-package `react-iran-map` (data, logic and React in one package). Data and all computation now live in `@msameim181/iran-map-core`; this package contains only React state, events and rendering.

### Added

- Lean root entry (provinces + province capitals) and `@msameim181/iran-map-react/full` (every catalog, drop-in for the legacy package).
- `catalogs` prop and `createIranMap(catalogs)` to bind your own data set.
- One-time development warning when a requested feature needs a catalog that was not provided.
- Dual ESM/CJS build with bundled declarations; `react` is a peer dependency (>=16.8 code, 16.14 with `react-tooltip` 5).

### Changed

- Published to GitHub Packages as `@msameim181/iran-map-react`.
- Tooling: Vite library build, Vitest + Testing Library (replaces Jest), Node 22.
- Test libraries are no longer runtime dependencies.
- Interaction handlers are stable and the SVG view is memoized, so hovering does not re-render every path when props are referentially stable.

### Fixed

- `onHover` now receives the public area (`IranMapArea`, as typed) instead of an object that also contained `path` and `fill`.

### Behavior note

The default (root) entry no longer bundles county, island, sea or county-capital data. Import from `@msameim181/iran-map-react/full` for the legacy behavior.
