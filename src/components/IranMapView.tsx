import React, { useCallback, useMemo, useState } from 'react'
import { Tooltip } from 'react-tooltip'
import {
  MAP_CLASS_NAMES,
  getAreaFill,
  getIslandFill,
  getLabelMetrics,
  getLabeledWaterBodies,
  getProvinceLabelAreas,
} from '@msameim181/iran-map-core'
import type { IranMapCapital, IranMapModel, RenderableMapArea, RenderableMapIsland } from '@msameim181/iran-map-core'
import { AreaPath, CapitalMarker, IslandPath } from './parts'

export interface IranMapViewProps {
  model: IranMapModel
  width: number | string
  textColor: string
  tooltipTitle: string
  strokeColor: string
  strokeWidth: number
  ariaLabel: string
  landBackgroundColor: string
  selectedAreaId?: string
  selectedAreaColor?: string
  capitalMarkerColor: string
  capitalMarkerSize: number
  showCapitalLabels: boolean
  showWater: boolean
  waterColor: string
  seaLabelColor: string
  showSeaLabels: boolean
  showIslandLabels: boolean
  /** Unique tooltip id, or undefined to render no tooltip. */
  tooltipId?: string
  tooltipDisableStyleInjection?: boolean | 'core'
  onAreaClick: (area: RenderableMapArea) => void
  onAreaHover: (area: RenderableMapArea | null) => void
  onIslandClick: (island: RenderableMapIsland) => void
  onCapitalClick?: (capital: IranMapCapital) => void
}

interface TooltipPosition {
  x: number
  y: number
}

const IranMapView: React.FC<IranMapViewProps> = ({
  model,
  width,
  textColor,
  tooltipTitle,
  strokeColor,
  strokeWidth,
  ariaLabel,
  landBackgroundColor,
  selectedAreaId,
  selectedAreaColor,
  capitalMarkerColor,
  capitalMarkerSize,
  showCapitalLabels,
  showWater,
  waterColor,
  seaLabelColor,
  showSeaLabels,
  showIslandLabels,
  tooltipId,
  tooltipDisableStyleInjection,
  onAreaClick,
  onAreaHover,
  onIslandClick,
  onCapitalClick,
}) => {
  const { areas, islands, capitals, waterBodies, landBackgrounds, viewBox, showLabels, mapScale } = model
  // Memoized: a new object per render would defeat the memoized islands and capital markers that receive it.
  const metrics = useMemo(() => getLabelMetrics(mapScale), [mapScale])

  // react-tooltip's `float` mode follows the pointer, which a keyboard focus does not provide.
  // For keyboard focus the tooltip is pinned just below the focused element instead.
  const [focusPosition, setFocusPosition] = useState<TooltipPosition>()
  const handleFocus = useCallback((event: React.FocusEvent<SVGSVGElement>) => {
    const target = (event.target as Element).closest?.('[data-tooltip-id]')
    if (!target || !target.matches(':focus-visible')) return
    const rect = target.getBoundingClientRect()
    setFocusPosition({ x: rect.left + rect.width / 2, y: rect.bottom + 8 })
  }, [])
  const clearFocusPosition = useCallback(() => setFocusPosition(undefined), [])

  return (
    <>
      <svg
        className={MAP_CLASS_NAMES.svg}
        xmlns='http://www.w3.org/2000/svg'
        viewBox={viewBox}
        shapeRendering='geometricPrecision'
        role='group'
        aria-label={ariaLabel}
        style={{ width, height: 'auto', color: textColor }}
        onFocus={tooltipId ? handleFocus : undefined}
        onBlur={tooltipId ? clearFocusPosition : undefined}
        onMouseOver={tooltipId && focusPosition ? clearFocusPosition : undefined}
      >
        {showWater && (
          <g className='iran-map-water-layer' aria-hidden='true'>
            {waterBodies.map((water) => (
              <path key={water.id} data-water-id={water.id} d={water.path} fill={waterColor} fillRule='evenodd' />
            ))}
            {showSeaLabels &&
              getLabeledWaterBodies(waterBodies).map((water) => (
                <g
                  key={`water-label:${water.id}`}
                  className='iran-map-water-label'
                  transform={`translate(${water.labelX} ${water.labelY})`}
                  fill={seaLabelColor}
                >
                  <text
                    className='iran-map-water-label-fa'
                    textAnchor='middle'
                    lang='fa'
                    fontSize={metrics.waterLabelFa.fontSize}
                  >
                    {water.faName}
                  </text>
                  <text
                    className='iran-map-water-label-en'
                    y={metrics.waterLabelEn.y}
                    textAnchor='middle'
                    fontSize={metrics.waterLabelEn.fontSize}
                  >
                    {water.name}
                  </text>
                </g>
              ))}
          </g>
        )}
        {landBackgrounds.length > 0 && (
          <g className='iran-map-land-background' aria-hidden='true'>
            {landBackgrounds.map((boundary) => (
              <path key={boundary.id} d={boundary.path} fill={landBackgroundColor} fillRule='evenodd' />
            ))}
          </g>
        )}
        {areas.map((area, index) => (
          <AreaPath
            key={`${area.type}:${area.id}:${index}`}
            area={area}
            fill={getAreaFill(area, selectedAreaId, selectedAreaColor)}
            selected={area.id === selectedAreaId}
            strokeColor={strokeColor}
            strokeWidth={strokeWidth}
            tooltipTitle={tooltipTitle}
            tooltipId={tooltipId}
            onClick={onAreaClick}
            onHover={onAreaHover}
          />
        ))}
        {islands.map((island) => (
          <IslandPath
            key={island.id}
            island={island}
            fill={getIslandFill(island, selectedAreaId, selectedAreaColor)}
            metrics={metrics}
            textColor={textColor}
            showLabel={showIslandLabels}
            strokeColor={strokeColor}
            strokeWidth={strokeWidth}
            tooltipId={tooltipId}
            onClick={onIslandClick}
            onHover={onAreaHover}
          />
        ))}
        {showLabels &&
          getProvinceLabelAreas(areas).map((area) => (
            <text
              key={`label:${area.id}`}
              className='iran-map-label'
              x={area.labelX}
              y={area.labelY}
              fill={textColor}
              textAnchor='middle'
              dominantBaseline='middle'
              fontSize={metrics.provinceLabel.fontSize}
              strokeWidth={metrics.provinceLabel.strokeWidth}
            >
              {area.faName}
            </text>
          ))}
        {capitals.map((capital) => (
          <CapitalMarker
            key={capital.id}
            capital={capital}
            mapScale={mapScale}
            metrics={metrics}
            markerSize={capitalMarkerSize}
            markerColor={capitalMarkerColor}
            textColor={textColor}
            showLabel={showCapitalLabels}
            tooltipId={tooltipId}
            onSelect={onCapitalClick}
          />
        ))}
      </svg>
      {tooltipId && (
        <Tooltip
          id={tooltipId}
          variant='light'
          float
          positionStrategy='fixed'
          position={focusPosition}
          globalCloseEvents={{ escape: true }}
          disableStyleInjection={tooltipDisableStyleInjection}
          className={MAP_CLASS_NAMES.tooltip}
        />
      )}
    </>
  )
}

export default /*#__PURE__*/ React.memo(IranMapView)
