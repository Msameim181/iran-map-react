# Changelog

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

### Known issues

- `ScoreBands` (editor mode) commits every valid intermediate value while you type, e.g. typing `-5` first commits an empty (unbounded) bound before `-5` is rejected. This matches the legacy component; a hold-back-until-valid behavior is planned for 0.2.
