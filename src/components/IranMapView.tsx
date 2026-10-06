import React from 'react'
import { Tooltip } from 'react-tooltip'
import {
  MAP_CLASS_NAMES,
  MAP_TOOLTIP_ID,
  getAreaFill,
  getAreaTestId,
  getAreaTooltip,
  getCapitalMarkerGeometry,
  getCapitalTestId,
  getCapitalTooltip,
  getIslandFill,
  getIslandTestId,
  getIslandTooltip,
  getLabelMetrics,
  getLabeledWaterBodies,
  getProvinceLabelAreas,
  isActivationKey,
} from '@msameim181/iran-map-core'
import type { IranMapCapital, IranMapModel, RenderableMapArea, RenderableMapIsland } from '@msameim181/iran-map-core'

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
  onAreaClick: (area: RenderableMapArea) => void
  onAreaHover: (area: RenderableMapArea | null) => void
  onIslandClick: (island: RenderableMapIsland) => void
  onCapitalClick: (capital: IranMapCapital) => void
}

const activate = (callback: () => void) => (event: React.KeyboardEvent) => {
  if (isActivationKey(event.key)) {
    event.preventDefault()
    callback()
  }
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
  onAreaClick,
  onAreaHover,
  onIslandClick,
  onCapitalClick,
}) => {
  const { areas, islands, capitals, waterBodies, landBackgrounds, viewBox, showLabels, mapScale } = model
  const metrics = getLabelMetrics(mapScale)

  return (
    <>
      <svg
        className={MAP_CLASS_NAMES.svg}
        xmlns='http://www.w3.org/2000/svg'
        viewBox={viewBox}
        shapeRendering='geometricPrecision'
        role='img'
        aria-label={ariaLabel}
        style={{ width, height: 'auto', color: textColor }}
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
        {areas.map((area, index) => {
          const tooltip = getAreaTooltip(area, tooltipTitle)
          return (
            <path
              key={`${area.type}:${area.id}:${index}`}
              d={area.path}
              fill={getAreaFill(area, selectedAreaId, selectedAreaColor)}
              fillRule='evenodd'
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin='round'
              strokeLinecap='round'
              strokeMiterlimit={1}
              vectorEffect='non-scaling-stroke'
              tabIndex={0}
              role='button'
              aria-pressed={area.id === selectedAreaId}
              aria-label={tooltip}
              data-testid={getAreaTestId(area)}
              data-area-id={area.id}
              data-area-type={area.type}
              data-tooltip-id={MAP_TOOLTIP_ID}
              data-tooltip-content={tooltip}
              className={MAP_CLASS_NAMES.area}
              onClick={() => onAreaClick(area)}
              onMouseEnter={() => onAreaHover(area)}
              onMouseLeave={() => onAreaHover(null)}
              onFocus={() => onAreaHover(area)}
              onBlur={() => onAreaHover(null)}
              onKeyDown={activate(() => onAreaClick(area))}
            />
          )
        })}
        {islands.map((island) => {
          const tooltip = getIslandTooltip(island)
          return (
            <g
              key={island.id}
              className={MAP_CLASS_NAMES.island}
              tabIndex={0}
              role='button'
              aria-label={tooltip}
              data-testid={getIslandTestId(island)}
              data-island-id={island.id}
              data-province-id={island.provinceId}
              data-county-id={island.countyId}
              data-latitude={island.latitude}
              data-longitude={island.longitude}
              data-tooltip-id={MAP_TOOLTIP_ID}
              data-tooltip-content={tooltip}
              onClick={() => onIslandClick(island)}
              onMouseEnter={() => onAreaHover(island.area)}
              onMouseLeave={() => onAreaHover(null)}
              onFocus={() => onAreaHover(island.area)}
              onBlur={() => onAreaHover(null)}
              onKeyDown={activate(() => onIslandClick(island))}
            >
              <circle
                className='iran-map-island-hit'
                cx={island.labelX}
                cy={island.labelY}
                r={metrics.islandHitRadius}
              />
              <path
                className='iran-map-island-shape'
                d={island.path}
                fill={getIslandFill(island, selectedAreaId, selectedAreaColor)}
                fillRule='evenodd'
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinejoin='round'
                strokeLinecap='round'
                strokeMiterlimit={1}
                vectorEffect='non-scaling-stroke'
              />
              {showIslandLabels && island.featured && (
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
        })}
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
        {capitals.map((capital) => {
          const geometry = getCapitalMarkerGeometry(capital, capitalMarkerSize, mapScale)
          const tooltip = getCapitalTooltip(capital)
          return (
            <g
              key={capital.id}
              className={`${MAP_CLASS_NAMES.capital} iran-map-capital--${capital.areaType}`}
              transform={`translate(${capital.x} ${capital.y})`}
              tabIndex={0}
              role='button'
              aria-label={tooltip}
              data-testid={getCapitalTestId(capital)}
              data-area-id={capital.areaId}
              data-capital-type={capital.areaType}
              data-latitude={capital.latitude}
              data-longitude={capital.longitude}
              data-tooltip-id={MAP_TOOLTIP_ID}
              data-tooltip-content={tooltip}
              onClick={() => onCapitalClick(capital)}
              onKeyDown={activate(() => onCapitalClick(capital))}
            >
              <circle className='iran-map-capital-hit' r={geometry.hitRadius} />
              <circle className='iran-map-capital-halo' r={geometry.haloRadius} />
              {geometry.shape === 'diamond' ? (
                <path className='iran-map-capital-core' d={geometry.diamondPath} fill={capitalMarkerColor} />
              ) : (
                <circle className='iran-map-capital-core' r={geometry.coreRadius} fill={capitalMarkerColor} />
              )}
              <circle className='iran-map-capital-center' r={geometry.centerRadius} />
              {showCapitalLabels && (
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
        })}
      </svg>
      <Tooltip id={MAP_TOOLTIP_ID} variant='light' float className={MAP_CLASS_NAMES.tooltip} />
    </>
  )
}

export default IranMapView
