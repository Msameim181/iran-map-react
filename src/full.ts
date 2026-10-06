import { fullCatalogs } from '@msameim181/iran-map-core/full'
import { createIranMap } from './components/IranMap'

/** Drop-in replacement for the legacy `react-iran-map`: every catalog is bound by default (~1.9 MB gzipped of data). */
export const IranMap = /*#__PURE__*/ createIranMap(fullCatalogs)

export { createIranMap }
export type { IranMapProps } from './components/IranMap'
export { default as ScoreBands } from './components/ScoreBands'
export type { ScoreBandsProps } from './components/ScoreBands'
export type {
  IranMapArea,
  IranMapAreaType,
  IranMapCapital,
  IranMapCapitalLayer,
  IranMapCapitalType,
  IranMapCatalogName,
  IranMapCatalogs,
  IranMapColorBand,
  IranMapIsland,
  IranMapMode,
  IranMapModel,
  IranMapModelOptions,
  IranMapRegion,
  IranMapValue,
  IranMapWaterBody,
  IranMapWrapperProps,
  MapBoundary,
  RegionAggregation,
  RenderableMapArea,
  RenderableMapIsland,
  mapDataType,
  provinceType,
  selectedProvinceType,
} from '@msameim181/iran-map-core'
export { normalizeMapValue } from '@msameim181/iran-map-core'
export {
  countyBoundaries,
  countyCapitalMarkers,
  fullCatalogs,
  iranIslands,
  iranWaterBodies,
  provinceBoundaries,
  provinceCapitalMarkers,
  provinceCatalogs,
} from '@msameim181/iran-map-core/full'
