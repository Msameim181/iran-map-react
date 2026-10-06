import React from 'react'
import {
  MAP_CLASS_NAMES,
  getAreaTestId,
  getAreaTooltip,
  getCapitalMarkerGeometry,
  getCapitalTestId,
  getCapitalTooltip,
  getIslandTestId,
  getIslandTooltip,
} from '@msameim181/iran-map-core'
import type { IranMapCapital, RenderableMapArea, RenderableMapIsland } from '@msameim181/iran-map-core'
import { clearActivation, getActivationProps } from '../keyboard'

type Metrics = ReturnType<typeof import('@msameim181/iran-map-core').getLabelMetrics>

interface StrokeProps {
  strokeColor: string
  strokeWidth: number
}

// Selection changes only touch the previous and the new selection: every part is memoized on
// plain values and stable callbacks, so React skips the hundreds of unchanged paths.

export interface AreaPathProps extends StrokeProps {
  area: RenderableMapArea
  fill: string
  selected: boolean
  tooltipTitle: string
  tooltipId?: string
  onClick: (area: RenderableMapArea) => void
  onHover: (area: RenderableMapArea | null) => void
}

export const AreaPath = React.memo(function AreaPath({
  area,
  fill,
  selected,
  strokeColor,
  strokeWidth,
  tooltipTitle,
  tooltipId,
  onClick,
  onHover,
}: AreaPathProps) {
  const label = getAreaTooltip(area, tooltipTitle)
  const activate = () => onClick(area)
  const keys = getActivationProps(activate)
  return (
    <path
      d={area.path}
      fill={fill}
      fillRule='evenodd'
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinejoin='round'
      strokeLinecap='round'
      strokeMiterlimit={1}
      vectorEffect='non-scaling-stroke'
      tabIndex={0}
      role='button'
      aria-pressed={selected}
      aria-label={label}
      data-testid={getAreaTestId(area)}
      data-area-id={area.id}
      data-area-type={area.type}
      data-tooltip-id={tooltipId}
      data-tooltip-content={tooltipId ? label : undefined}
      className={MAP_CLASS_NAMES.area}
      onClick={activate}
      onMouseEnter={() => onHover(area)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(area)}
      onBlur={(event) => {
        clearActivation(event)
        onHover(null)
      }}
      {...keys}
    />
  )
})

export interface IslandPathProps extends StrokeProps {
  island: RenderableMapIsland
  fill: string
  metrics: Metrics
  textColor: string
  showLabel: boolean
  tooltipId?: string
  onClick: (island: RenderableMapIsland) => void
  onHover: (area: RenderableMapArea | null) => void
}

export const IslandPath = React.memo(function IslandPath({
  island,
  fill,
  metrics,
  textColor,
  showLabel,
  strokeColor,
  strokeWidth,
  tooltipId,
  onClick,
  onHover,
}: IslandPathProps) {
  const label = getIslandTooltip(island)
  const keys = getActivationProps(() => onClick(island))
  return (
    <g
      className={MAP_CLASS_NAMES.island}
      tabIndex={0}
      role='button'
      aria-label={label}
      data-testid={getIslandTestId(island)}
      data-island-id={island.id}
      data-province-id={island.provinceId}
      data-county-id={island.countyId}
      data-latitude={island.latitude}
      data-longitude={island.longitude}
      data-tooltip-id={tooltipId}
      data-tooltip-content={tooltipId ? label : undefined}
      onClick={() => onClick(island)}
      onMouseEnter={() => onHover(island.area)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(island.area)}
      onBlur={(event) => {
        clearActivation(event)
        onHover(null)
      }}
      {...keys}
    >
      <circle className='iran-map-island-hit' cx={island.labelX} cy={island.labelY} r={metrics.islandHitRadius} />
      <path
        className='iran-map-island-shape'
        d={island.path}
        fill={fill}
        fillRule='evenodd'
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinejoin='round'
        strokeLinecap='round'
        strokeMiterlimit={1}
        vectorEffect='non-scaling-stroke'
      />
      {showLabel && island.featured && (
        <text
          className='iran-map-island-label'
          x={island.labelX}
          y={island.labelY + metrics.islandLabel.offsetY}
          fill={textColor}
          textAnchor='middle'
          fontSize={metrics.islandLabel.fontSize}
          strokeWidth={metrics.islandLabel.strokeWidth}
        >
          {island.faName}
        </text>
      )}
    </g>
  )
})

export interface CapitalMarkerProps {
  capital: IranMapCapital
  mapScale: number
  metrics: Metrics
  markerSize: number
  markerColor: string
  textColor: string
  showLabel: boolean
  tooltipId?: string
  /** Without a handler a marker is decoration (tooltip only): it is not a focusable button. */
  onSelect?: (capital: IranMapCapital) => void
}

export const CapitalMarker = React.memo(function CapitalMarker({
  capital,
  mapScale,
  metrics,
  markerSize,
  markerColor,
  textColor,
  showLabel,
  tooltipId,
  onSelect,
}: CapitalMarkerProps) {
  const geometry = getCapitalMarkerGeometry(capital, markerSize, mapScale)
  const label = getCapitalTooltip(capital)
  const interactive = onSelect
    ? {
        tabIndex: 0,
        role: 'button',
        'aria-label': label,
        onClick: () => onSelect(capital),
        onBlur: clearActivation,
        ...getActivationProps(() => onSelect(capital)),
      }
    : {}
  return (
    <g
      className={`${MAP_CLASS_NAMES.capital} iran-map-capital--${capital.areaType}`}
      transform={`translate(${capital.x} ${capital.y})`}
      data-testid={getCapitalTestId(capital)}
      data-area-id={capital.areaId}
      data-capital-type={capital.areaType}
      data-latitude={capital.latitude}
      data-longitude={capital.longitude}
      data-tooltip-id={tooltipId}
      data-tooltip-content={tooltipId ? label : undefined}
      {...interactive}
    >
      <circle className='iran-map-capital-hit' r={geometry.hitRadius} />
      <circle className='iran-map-capital-halo' r={geometry.haloRadius} />
      {geometry.shape === 'diamond' ? (
        <path className='iran-map-capital-core' d={geometry.diamondPath} fill={markerColor} />
      ) : (
        <circle className='iran-map-capital-core' r={geometry.coreRadius} fill={markerColor} />
      )}
      <circle className='iran-map-capital-center' r={geometry.centerRadius} />
      {showLabel && (
        <text
          className='iran-map-capital-label'
          x={geometry.label.x}
          y={geometry.label.y}
          fill={textColor}
          fontSize={metrics.capitalLabel.fontSize}
          strokeWidth={metrics.capitalLabel.strokeWidth}
        >
          {capital.faName}
        </text>
      )}
    </g>
  )
})
