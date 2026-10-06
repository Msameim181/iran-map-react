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
import '@msameim181/iran-map-core/styles.css'
import { warnOnce } from '../devWarn'
import IranMapView from './IranMapView'

export interface IranMapProps extends IranMapWrapperProps {
  /** Override the catalogs this map was created with, e.g. to add counties to the lean default. */
  catalogs?: IranMapCatalogs
}

const NO_REGIONS: NonNullable<IranMapWrapperProps['regions']> = []
const NO_COUNTIES: string[] = []

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
      catalogs = defaultCatalogs,
    } = props
    const selectedAreaColor = resolveSelectedAreaColor(props)
    const [selectedAreaId, setSelectedAreaId] = useState(resolveDefaultSelectedArea(props))
    const wrapperRef = useRef<HTMLDivElement>(null)

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
    // handlers below stable, so the memoized view is skipped when only a parent re-renders (e.g. on hover).
    const callbacks = useRef({
      onSelect,
      onDeselect,
      onHover,
      selectProvinceHandler,
      onCapitalSelect,
      onIslandSelect,
    })
    callbacks.current = { onSelect, onDeselect, onHover, selectProvinceHandler, onCapitalSelect, onIslandSelect }

    const clearSelection = useCallback(() => {
      if (selectedAreaId === undefined) return
      const { onDeselect, onHover, selectProvinceHandler } = callbacks.current
      setSelectedAreaId(undefined)
      onDeselect?.()
      onHover?.(null)
      const province = getDeselectProvince(catalogs.provinces, selectedAreaId)
      if (province) selectProvinceHandler?.(province)
    }, [catalogs.provinces, selectedAreaId])

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
          onAreaClick={handleAreaClick}
          onAreaHover={handleAreaHover}
          onIslandClick={handleIslandSelect}
          onCapitalClick={handleCapitalSelect}
        />
      </div>
    )
  }
  return IranMap
}
