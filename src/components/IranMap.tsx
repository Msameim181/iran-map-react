import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  SELECTABLE_ELEMENT_SELECTOR,
  buildMapModel,
  getDeselectProvince,
  iranMapDefaults,
  resolveAreaSelection,
  resolveDefaultSelectedArea,
  resolveSelectedAreaColor,
  toPublicArea,
  toPublicIsland,
} from '@msameim181/iran-map-core'
import type {
  IranMapCapital,
  IranMapCatalogs,
  IranMapWrapperProps,
  RenderableMapArea,
  RenderableMapIsland,
} from '@msameim181/iran-map-core'
import { warnOnce } from '../devWarn'
import { sanitizeId, useInstanceId } from '../instanceId'
import { useIsomorphicLayoutEffect } from '../useIsomorphicLayoutEffect'
import IranMapView from './IranMapView'

export interface IranMapProps extends IranMapWrapperProps {
  /**
   * Catalogs to use instead of the ones this map was created with. Each field replaces the matching default;
   * fields you leave out keep the default (e.g. `{ counties }` adds counties to the lean map).
   */
  catalogs?: Partial<IranMapCatalogs>
  /** Render the hover/focus tooltip. Default `true`; `false` also drops the `react-tooltip` instance. */
  tooltip?: boolean
  /** Tooltip element id. Defaults to a unique id per map; pass a stable one for server rendering under React < 18. */
  tooltipId?: string
  /** Forwarded to react-tooltip: `true` stops it injecting its `<style>` tag (strict CSP), `'core'` keeps the core CSS. */
  tooltipDisableStyleInjection?: boolean | 'core'
}

const NO_REGIONS: NonNullable<IranMapWrapperProps['regions']> = []
const NO_COUNTIES: string[] = []

/** Merges field by field so inline `catalogs={{ counties }}` objects do not invalidate the model on every render. */
const useMergedCatalogs = (defaults: IranMapCatalogs, catalogs?: Partial<IranMapCatalogs>): IranMapCatalogs => {
  const { provinces, counties, islands, waterBodies, provinceCapitals, countyCapitals } = catalogs ?? {}
  return useMemo(
    () => ({
      provinces: provinces ?? defaults.provinces,
      counties: counties ?? defaults.counties,
      islands: islands ?? defaults.islands,
      waterBodies: waterBodies ?? defaults.waterBodies,
      provinceCapitals: provinceCapitals ?? defaults.provinceCapitals,
      countyCapitals: countyCapitals ?? defaults.countyCapitals,
    }),
    [defaults, provinces, counties, islands, waterBodies, provinceCapitals, countyCapitals],
  )
}

/**
 * Creates an IranMap bound to a default set of catalogs. The root entry binds provinces only;
 * `@msameim181/iran-map-react/full` binds every catalog (the legacy behaviour).
 */
export const createIranMap = (defaultCatalogs: IranMapCatalogs): React.FC<IranMapProps> => {
  const IranMap: React.FC<IranMapProps> = (props) => {
    const {
      data,
      width,
      colorRange,
      colorBands,
      mode,
      regions = NO_REGIONS,
      detailedCounties = NO_COUNTIES,
      focusProvince,
      focusPadding,
      regionAggregation,
      textColor = iranMapDefaults.textColor,
      deactiveProvinceColor = iranMapDefaults.deactiveProvinceColor,
      tooltipTitle = iranMapDefaults.tooltipTitle,
      selectProvinceHandler,
      onSelect,
      onDeselect,
      onHover,
      strokeColor = iranMapDefaults.strokeColor,
      strokeWidth = iranMapDefaults.strokeWidth,
      className = iranMapDefaults.className,
      ariaLabel = iranMapDefaults.ariaLabel,
      showLabels,
      capitalMarkers,
      capitalMarkerColor = iranMapDefaults.capitalMarkerColor,
      capitalMarkerSize = iranMapDefaults.capitalMarkerSize,
      showCapitalLabels = iranMapDefaults.showCapitalLabels,
      onCapitalSelect,
      showWater,
      waterColor = iranMapDefaults.waterColor,
      seaLabelColor = iranMapDefaults.seaLabelColor,
      showSeaLabels = iranMapDefaults.showSeaLabels,
      showIslands,
      showIslandLabels = iranMapDefaults.showIslandLabels,
      onIslandSelect,
      catalogs: catalogsProp,
      tooltip = true,
      tooltipId: tooltipIdProp,
      tooltipDisableStyleInjection,
    } = props
    const catalogs = useMergedCatalogs(defaultCatalogs, catalogsProp)
    const selectedAreaColor = resolveSelectedAreaColor(props)
    const [selectedAreaId, setSelectedAreaId] = useState(resolveDefaultSelectedArea(props))
    const wrapperRef = useRef<HTMLDivElement>(null)
    const instanceId = useInstanceId()
    const tooltipId = tooltip ? (tooltipIdProp ?? `iran-map-tooltip-${sanitizeId(instanceId)}`) : undefined

    const model = useMemo(
      () =>
        buildMapModel(
          {
            data,
            mode,
            regions,
            detailedCounties,
            focusProvince,
            focusPadding,
            regionAggregation,
            colorRange,
            colorBands,
            deactiveProvinceColor,
            capitalMarkers,
            showIslands,
            showLabels,
            showWater,
          },
          catalogs,
        ),
      [
        catalogs,
        data,
        mode,
        regions,
        detailedCounties,
        focusProvince,
        focusPadding,
        regionAggregation,
        colorRange,
        colorBands,
        deactiveProvinceColor,
        capitalMarkers,
        showIslands,
        showLabels,
        showWater,
      ],
    )

    useEffect(() => {
      model.warnings.forEach(warnOnce)
    }, [model.warnings])

    // Consumer callbacks are usually inline and change every render. Reading them through a ref keeps the
    // handlers below stable, so memoized parts are skipped when only a parent re-renders (e.g. on hover).
    // The ref is written in a layout effect, not during render, so an abandoned concurrent render cannot leak.
    const callbacks = useRef({
      onSelect,
      onDeselect,
      onHover,
      selectProvinceHandler,
      onCapitalSelect,
      onIslandSelect,
    })
    useIsomorphicLayoutEffect(() => {
      callbacks.current = { onSelect, onDeselect, onHover, selectProvinceHandler, onCapitalSelect, onIslandSelect }
    })

    const clearSelection = useCallback(() => {
      if (selectedAreaId === undefined) return
      const { onDeselect, onHover, selectProvinceHandler } = callbacks.current
      setSelectedAreaId(undefined)
      onDeselect?.()
      onHover?.(null)
      const province = getDeselectProvince(catalogs.provinces, selectedAreaId)
      if (province) selectProvinceHandler?.(province)
    }, [catalogs.provinces, selectedAreaId])

    // Selection policy: when the selected area leaves the model (mode, focus or data change), it is cleared and
    // `onDeselect` fires once. A `defaultSelectedArea` that was never in the model is dropped silently.
    const wasPresent = useRef<string>()
    useEffect(() => {
      if (selectedAreaId === undefined) return
      if (model.areas.some((area) => area.id === selectedAreaId)) {
        wasPresent.current = selectedAreaId
      } else if (wasPresent.current === selectedAreaId) {
        wasPresent.current = undefined
        clearSelection()
      } else {
        setSelectedAreaId(undefined)
      }
    }, [clearSelection, model, selectedAreaId])

    useEffect(() => {
      const wrapper = wrapperRef.current
      if (!wrapper || selectedAreaId === undefined) return
      const ownerDocument = wrapper.ownerDocument
      const handleClick = (event: MouseEvent) => {
        const target = event.target as Node | null
        const element = target?.nodeType === 1 ? (target as Element) : target?.parentElement
        if (wrapper.contains(target) && element?.closest(SELECTABLE_ELEMENT_SELECTOR)) return
        clearSelection()
      }
      ownerDocument.addEventListener('click', handleClick, true)
      return () => ownerDocument.removeEventListener('click', handleClick, true)
    }, [clearSelection, selectedAreaId])

    const handleSelect = useCallback(
      (area: RenderableMapArea, toggle = true) => {
        const result = resolveAreaSelection(selectedAreaId, area, toggle)
        if (result.action === 'deselect') {
          clearSelection()
          return
        }
        setSelectedAreaId(result.selectedId)
        callbacks.current.onSelect?.(result.area)
        if (result.province) callbacks.current.selectProvinceHandler?.(result.province)
      },
      [clearSelection, selectedAreaId],
    )

    const handleAreaClick = useCallback((area: RenderableMapArea) => handleSelect(area), [handleSelect])
    const handleAreaHover = useCallback(
      (area: RenderableMapArea | null) => callbacks.current.onHover?.(area && toPublicArea(area)),
      [],
    )
    const handleIslandSelect = useCallback(
      (island: RenderableMapIsland) => {
        handleSelect(island.area, false)
        callbacks.current.onIslandSelect?.(toPublicIsland(island), toPublicArea(island.area))
      },
      [handleSelect],
    )
    const handleCapitalSelect = useCallback(
      (capital: IranMapCapital) => callbacks.current.onCapitalSelect?.(capital),
      [],
    )

    return (
      <div
        ref={wrapperRef}
        className={`iran-map-wrapper ${className}`.trim()}
        style={{ width: width || iranMapDefaults.width }}
        onKeyDown={selectedAreaId === undefined ? undefined : (event) => event.key === 'Escape' && clearSelection()}
      >
        <IranMapView
          model={model}
          width='100%'
          textColor={textColor}
          tooltipTitle={tooltipTitle}
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
          ariaLabel={ariaLabel}
          landBackgroundColor={deactiveProvinceColor}
          selectedAreaId={selectedAreaId}
          selectedAreaColor={selectedAreaColor}
          capitalMarkerColor={capitalMarkerColor}
          capitalMarkerSize={capitalMarkerSize}
          showCapitalLabels={showCapitalLabels}
          showWater={showWater ?? iranMapDefaults.showWater}
          waterColor={waterColor}
          seaLabelColor={seaLabelColor}
          showSeaLabels={showSeaLabels}
          showIslandLabels={showIslandLabels}
          tooltipId={tooltipId}
          tooltipDisableStyleInjection={tooltipDisableStyleInjection}
          onAreaClick={handleAreaClick}
          onAreaHover={handleAreaHover}
          onIslandClick={handleIslandSelect}
          onCapitalClick={onCapitalSelect ? handleCapitalSelect : undefined}
        />
      </div>
    )
  }
  return IranMap
}
