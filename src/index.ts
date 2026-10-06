import { provinceBoundaries, provinceCapitalMarkers, provinceCatalogs } from '@msameim181/iran-map-core/lean'
import { createIranMap } from './components/IranMap'

/** Lean map: province polygons and province capitals only. For counties, islands and seas use `/lite`, `/full` or `catalogs`. */
export const IranMap = /*#__PURE__*/ createIranMap(provinceCatalogs)

export { createIranMap }
export type { IranMapProps } from './components/IranMap'
export { default as ScoreBands } from './components/ScoreBands'
export type { ScoreBandsProps } from './components/ScoreBands'
export { provinceBoundaries, provinceCapitalMarkers }
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
