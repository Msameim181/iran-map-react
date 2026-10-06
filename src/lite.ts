import { liteCatalogs } from '@msameim181/iran-map-core/lite'
import { createIranMap } from './components/IranMap'

/** Every catalog at core's "lite" detail level: the full feature set with much smaller geometry. */
export const IranMap = /*#__PURE__*/ createIranMap(liteCatalogs)

export { createIranMap, liteCatalogs }
export type { IranMapProps } from './components/IranMap'
export { default as ScoreBands } from './components/ScoreBands'
export type { ScoreBandsProps } from './components/ScoreBands'
