import React, { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  addBand,
  applyDrafts,
  editBound,
  getBoundInputLimits,
  getColorInputValue,
  getDomainLabel,
  getDraftKey,
  getLegendItems,
  getScoreBandsHeading,
  getScoreBandsLabel,
  hasInvalidBands,
  isValidBand,
  isValidDomain,
  removeBand,
  scoreBandsDefaults,
  scoreBandsText,
  updateBand,
} from '@msameim181/iran-map-core'
import type { IranMapColorBand, ScoreBandDrafts, ScoreBandField } from '@msameim181/iran-map-core'

export interface ScoreBandsProps {
  bands: IranMapColorBand[]
  /** With onChange, render a controlled band editor; without it, render a legend. */
  onChange?: (bands: IranMapColorBand[]) => void
  scale?: 'score' | 'numeric'
  /** Display domain. Defaults to 0–100; numeric scales may use any finite x–y domain. */
  min?: number
  max?: number
  metricLabel?: string
  orientation?: 'horizontal' | 'vertical'
  formatValue?: (value: number) => string
  showNoData?: boolean
  noDataColor?: string
  noDataLabel?: string
  className?: string
  style?: CSSProperties
}

const FIELDS: ScoreBandField[] = ['min', 'max']

const ScoreBands: React.FC<ScoreBandsProps> = ({
  bands,
  onChange,
  scale = scoreBandsDefaults.scale,
  min = scoreBandsDefaults.min,
  max = scoreBandsDefaults.max,
  metricLabel = scoreBandsDefaults.metricLabel,
  orientation = scoreBandsDefaults.orientation,
  formatValue = String,
  showNoData = scoreBandsDefaults.showNoData,
  noDataColor = scoreBandsDefaults.noDataColor,
  noDataLabel = scoreBandsDefaults.noDataLabel,
  className = '',
  style,
}) => {
  const [drafts, setDrafts] = useState<ScoreBandDrafts>({})
  useEffect(() => setDrafts({}), [bands])
  const validDomain = isValidDomain(min, max, scale)
  const invalid = hasInvalidBands(bands, drafts, scale)
  const limits = getBoundInputLimits(scale)

  const updateBound = (index: number, field: ScoreBandField, text: string) => {
    const edit = editBound(bands, drafts, index, field, text, scale)
    setDrafts(edit.drafts)
    if (edit.bands) onChange?.(edit.bands)
  }

  return (
    <section
      className={`iran-score-bands ${className}`.trim()}
      style={style}
      aria-label={getScoreBandsLabel(metricLabel)}
    >
      <header className='iran-score-bands-heading'>
        <h2>{getScoreBandsHeading(metricLabel)}</h2>
        {validDomain && <span>{getDomainLabel(min, max, formatValue)}</span>}
      </header>
      {!validDomain && <p role='alert'>{scoreBandsText.invalidDomain}</p>}
      <ul className={`iran-score-bands-legend iran-score-bands-legend--${orientation}`}>
        {getLegendItems(bands, { formatValue, showNoData, noDataColor, noDataLabel }).map((item, index) => (
          <li key={index}>
            <span className='iran-score-bands-swatch' style={{ backgroundColor: item.color }} aria-hidden='true' />
            <strong>{item.title}</strong>
            {item.range && <small>{item.range}</small>}
          </li>
        ))}
      </ul>
      {bands.length === 0 && <p>{scoreBandsText.noBands}</p>}
      {onChange && (
        <div className='iran-score-bands-editor'>
          {bands.map((band, index) => (
            <fieldset key={index}>
              <legend>Band {index + 1}</legend>
              <label>
                <span>Label</span>
                <input
                  type='text'
                  value={band.label || ''}
                  onChange={(event) => onChange(updateBand(bands, index, { label: event.target.value }))}
                />
              </label>
              {FIELDS.map((field) => (
                <label key={field}>
                  <span>{field === 'min' ? scoreBandsText.minimumLabel : scoreBandsText.maximumLabel}</span>
                  <input
                    type='number'
                    step='any'
                    min={limits.min}
                    max={limits.max}
                    placeholder='Unbounded'
                    value={drafts[getDraftKey(index, field)] ?? band[field] ?? ''}
                    aria-invalid={!isValidBand(applyDrafts(band, drafts, index), scale)}
                    onChange={(event) => updateBound(index, field, event.target.value)}
                  />
                </label>
              ))}
              <label>
                <span>Color</span>
                <input
                  type='color'
                  value={getColorInputValue(band.color)}
                  onChange={(event) => onChange(updateBand(bands, index, { color: event.target.value }))}
                />
              </label>
              <button
                type='button'
                aria-label={`Remove band ${index + 1}`}
                onClick={() => onChange(removeBand(bands, index))}
              >
                {scoreBandsText.removeBand}
              </button>
            </fieldset>
          ))}
          {invalid && <p role='alert'>{scoreBandsText.invalidBands}</p>}
          <button type='button' disabled={!validDomain} onClick={() => onChange(addBand(bands, min, max))}>
            {scoreBandsText.addBand}
          </button>
          <p>{scoreBandsText.help}</p>
        </div>
      )}
    </section>
  )
}

export default ScoreBands
