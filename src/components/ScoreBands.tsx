import React, { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  addBand,
  applyDrafts,
  commitDraft,
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
  removeBandWithDrafts,
  scoreBandsDefaults,
  setDraft,
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

const without = <T,>(record: Record<string, T>, key: string): Record<string, T> => {
  const next = { ...record }
  delete next[key]
  return next
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
  // Typed text lives in drafts and only reaches `onChange` on blur or Enter, so half-typed values never change the map.
  const [drafts, setDrafts] = useState<ScoreBandDrafts>({})
  // Inputs currently holding partial text such as "-" (see onChange); they are never committed.
  const [partial, setPartial] = useState<Record<string, true>>({})
  // Bands this component just emitted: when they come back as the prop, the drafts of other bands are still valid.
  const emitted = useRef<IranMapColorBand[]>()
  useEffect(() => {
    if (bands === emitted.current) emitted.current = undefined
    else {
      setDrafts({})
      setPartial({})
    }
  }, [bands])
  const emit = (next: IranMapColorBand[]) => {
    emitted.current = next
    onChange?.(next)
  }
  const validDomain = isValidDomain(min, max, scale)
  const invalid = hasInvalidBands(bands, drafts, scale)
  const limits = getBoundInputLimits(scale)

  const commit = (index: number) => {
    // Partial text such as "-" is abandoned on commit: the input falls back to the band's current bound.
    setPartial((current) => without(without(current, getDraftKey(index, 'min')), getDraftKey(index, 'max')))
    const edit = commitDraft(bands, drafts, index, scale)
    setDrafts(edit.drafts)
    if (edit.bands) emit(edit.bands)
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
                  onChange={(event) => emit(updateBand(bands, index, { label: event.target.value }))}
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
                    value={
                      partial[getDraftKey(index, field)] ? '' : (drafts[getDraftKey(index, field)] ?? band[field] ?? '')
                    }
                    aria-invalid={
                      partial[getDraftKey(index, field)] || !isValidBand(applyDrafts(band, drafts, index), scale)
                    }
                    onChange={(event) => {
                      const key = getDraftKey(index, field)
                      // A number input holding partial text such as "-" or "3-0" reports an empty value with
                      // `badInput` set. Recording that as a blank draft would later commit "unbounded", silently,
                      // so it is tracked separately. The input keeps showing '' (not the old value) so React does
                      // not overwrite what the user is typing.
                      if (event.target.validity?.badInput) {
                        setPartial((current) => ({ ...current, [key]: true }))
                        setDrafts((current) => without(current, key))
                        return
                      }
                      const { value } = event.target
                      setPartial((current) => without(current, key))
                      setDrafts((current) => setDraft(current, index, field, value))
                    }}
                    onBlur={() => commit(index)}
                    onKeyDown={(event) => event.key === 'Enter' && commit(index)}
                  />
                </label>
              ))}
              <label>
                <span>Color</span>
                <input
                  type='color'
                  value={getColorInputValue(band.color)}
                  onChange={(event) => emit(updateBand(bands, index, { color: event.target.value }))}
                />
              </label>
              <button
                type='button'
                aria-label={`Remove band ${index + 1}`}
                onClick={() => {
                  const removed = removeBandWithDrafts(bands, drafts, index)
                  setDrafts(removed.drafts)
                  setPartial({})
                  emit(removed.bands)
                }}
              >
                {scoreBandsText.removeBand}
              </button>
            </fieldset>
          ))}
          {invalid && <p role='alert'>{scoreBandsText.invalidBands}</p>}
          <button type='button' disabled={!validDomain} onClick={() => emit(addBand(bands, min))}>
            {scoreBandsText.addBand}
          </button>
          <p>{scoreBandsText.help}</p>
        </div>
      )}
    </section>
  )
}

export default ScoreBands
