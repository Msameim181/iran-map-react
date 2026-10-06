import React, { useState } from 'react'
import type { IranMapValue, MapBoundary } from '@msameim181/iran-map-react'
import { normalizeMapValue } from '../../src/utils/mapValues'

interface CountyEditorProps {
  counties: MapBoundary[]
  enabledCounties: Record<string, boolean>
  values: Record<string, IranMapValue>
  valueDrafts: Record<string, string>
  metricName: string
  onToggle: (id: string, enabled: boolean) => void
  onToggleAll: (enabled: boolean) => void
  onValueChange: (id: string, draft: string) => void
  onNoDataChange: (id: string, noData: boolean) => void
}

const CountyEditor: React.FC<CountyEditorProps> = ({
  counties,
  enabledCounties,
  values,
  valueDrafts,
  metricName,
  onToggle,
  onToggleAll,
  onValueChange,
  onNoDataChange,
}) => {
  const [search, setSearch] = useState('')
  const query = search.trim().toLocaleLowerCase()
  const visibleCounties = counties.filter((county) =>
    `${county.name} ${county.faName}`.toLocaleLowerCase().includes(query),
  )
  const enabledCount = counties.filter((county) => enabledCounties[county.id]).length

  return (
    <section className='county-editor' aria-label='Province county editor'>
      <div className='county-editor-heading'>
        <div>
          <h2 className='panel-kicker'>County detail</h2>
          <p aria-live='polite'>
            {enabledCount} of {counties.length} counties enabled
          </p>
        </div>
        <div className='county-actions'>
          <button type='button' onClick={() => onToggleAll(true)} disabled={enabledCount === counties.length}>
            Enable all counties
          </button>
          <button type='button' onClick={() => onToggleAll(false)} disabled={enabledCount === 0}>
            Clear selection
          </button>
        </div>
      </div>
      <label className='county-search'>
        <span>Find a county</span>
        <input
          type='search'
          value={search}
          placeholder='English or فارسی'
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <p className='county-editor-help' id='county-value-help'>
        Enable a county to show its boundary, then edit its {metricName.toLocaleLowerCase()}. Colors update instantly.
      </p>
      <div className='county-list'>
        {visibleCounties.length ? (
          visibleCounties.map((county) => {
            const enabled = !!enabledCounties[county.id]
            const draft = valueDrafts[county.id] ?? String(values[county.id] ?? '')
            const noData = normalizeMapValue(values[county.id]) === undefined
            const invalid = !noData && (draft.trim() === '' || !Number.isFinite(Number(draft)))
            return (
              <div className={`county-row${enabled ? ' is-enabled' : ''}`} key={county.id}>
                <label className='county-toggle'>
                  <input
                    type='checkbox'
                    checked={enabled}
                    aria-label={`Show ${county.name}`}
                    onChange={(event) => onToggle(county.id, event.target.checked)}
                  />
                  <span>
                    <strong>{county.name}</strong>
                    <small lang='fa' dir='rtl'>
                      {county.faName}
                    </small>
                  </span>
                </label>
                <input
                  className='county-value'
                  type='number'
                  step='any'
                  value={draft}
                  disabled={!enabled || noData}
                  aria-label={`${county.name} ${metricName}`}
                  aria-invalid={enabled && invalid}
                  aria-describedby={enabled && invalid ? 'county-value-error' : 'county-value-help'}
                  onChange={(event) => onValueChange(county.id, event.target.value)}
                />
                <label className='county-no-data'>
                  <input
                    type='checkbox'
                    checked={noData}
                    disabled={!enabled}
                    aria-label={`${county.name} has no data`}
                    onChange={(event) => onNoDataChange(county.id, event.target.checked)}
                  />
                  No data
                </label>
              </div>
            )
          })
        ) : (
          <p className='county-empty'>No counties match. Try another English or Persian name.</p>
        )}
      </div>
      {counties.some((county) => {
        const draft = valueDrafts[county.id]
        return (
          enabledCounties[county.id] &&
          normalizeMapValue(values[county.id]) !== undefined &&
          draft !== undefined &&
          (draft.trim() === '' || !Number.isFinite(Number(draft)))
        )
      }) && (
        <p className='county-value-error' id='county-value-error' role='status'>
          Enter a number. The map keeps the last valid value while a field is empty or invalid.
        </p>
      )}
    </section>
  )
}

export default CountyEditor
