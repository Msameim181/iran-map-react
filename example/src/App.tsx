import React, { useMemo, useState } from 'react'
import { IranMap, ScoreBands, countyBoundaries, provinceBoundaries } from '@msameim181/iran-map-react'
import type {
  IranMapArea,
  IranMapCapital,
  IranMapCapitalLayer,
  IranMapIsland,
  IranMapMode,
  IranMapRegion,
  IranMapValue,
  IranMapColorBand,
} from '@msameim181/iran-map-react'
import { normalizeMapValue } from '../../src/utils/mapValues'
import CountyEditor from './CountyEditor'

type DemoMode = IranMapMode | 'mixed' | 'focus'

const modes: Array<{ id: DemoMode; label: string; caption: string }> = [
  { id: 'province', label: 'Provinces', caption: '31 administrative areas' },
  { id: 'county', label: 'Counties', caption: '478 detailed boundaries' },
  { id: 'mixed', label: 'Mixed detail', caption: 'Selected counties on provinces' },
  { id: 'focus', label: 'Province focus', caption: 'One province + selected counties' },
  { id: 'region', label: 'Custom regions', caption: 'Province groups + county detail' },
]

const regions: IranMapRegion[] = [
  {
    id: 'greater-khorasan',
    name: 'Greater Khorasan',
    faName: 'منطقه خراسان',
    provinces: ['razaviKhorasan', 'northKhorasan', 'southKhorasan'],
  },
  {
    id: 'northwest',
    name: 'Northwest',
    faName: 'منطقه شمال غرب',
    provinces: ['eastAzerbaijan', 'westAzerbaijan', 'ardabil', 'zanjan'],
  },
]

const detailCounties = ['razaviKhorasan.mashhad', 'tehran.tehran', 'fars.shiraz']
const focusCounties = ['razaviKhorasan.mashhad', 'razaviKhorasan.neyshabur', 'razaviKhorasan.torbatEHeydarieh']

const capitalLayers: Array<{ id: IranMapCapitalLayer; label: string }> = [
  { id: 'auto', label: 'Context' },
  { id: 'both', label: 'Both' },
  { id: 'none', label: 'Off' },
]

const defaultColorBands: IranMapColorBand[] = [
  { max: 25, color: '#bedfd5', label: 'Low' },
  { min: 25, max: 50, color: '#75b9ad', label: 'Watch' },
  { min: 50, max: 70, color: '#f2c15a', label: 'Elevated' },
  { min: 70, max: 85, color: '#e47b58', label: 'High' },
  { min: 85, color: '#a93f46', label: 'Critical' },
]

const provinceData = Object.fromEntries(
  provinceBoundaries.map((province, index) => [province.id, (index * 19 + 14) % 101]),
)

const countyData = Object.fromEntries(countyBoundaries.map((county, index) => [county.id, (index * 23 + 11) % 101]))

const demoData: Record<string, number> = {
  ...provinceData,
  ...countyData,
  'greater-khorasan': 76,
  northwest: 43,
  'razaviKhorasan.mashhad': 92,
  'tehran.tehran': 81,
  'fars.shiraz': 66,
}

const App: React.FC = () => {
  const [demoMode, setDemoMode] = useState<DemoMode>('mixed')
  const [selectedArea, setSelectedArea] = useState<IranMapArea | null>(null)
  const [hoveredArea, setHoveredArea] = useState<IranMapArea | null>(null)
  const [selectedCapital, setSelectedCapital] = useState<IranMapCapital | null>(null)
  const [capitalLayer, setCapitalLayer] = useState<IranMapCapitalLayer>('auto')
  const [showGeography, setShowGeography] = useState(true)
  const [selectedIsland, setSelectedIsland] = useState<IranMapIsland | null>(null)
  const [focusProvinceId, setFocusProvinceId] = useState('razaviKhorasan')
  const [enabledCounties, setEnabledCounties] = useState<Record<string, boolean>>(
    Object.fromEntries(focusCounties.map((id) => [id, true])),
  )
  const [valueOverrides, setValueOverrides] = useState<Record<string, IranMapValue>>({})
  const [valueDrafts, setValueDrafts] = useState<Record<string, string>>({})
  const [disabledProvinceValues, setDisabledProvinceValues] = useState<Record<string, boolean>>({})
  const [colorBands, setColorBands] = useState(defaultColorBands)
  const [bandScale, setBandScale] = useState<'score' | 'numeric'>('score')
  const [domainMin, setDomainMin] = useState(0)
  const [domainMax, setDomainMax] = useState(100)
  const [metricLabel, setMetricLabel] = useState('Score')
  const metricName = metricLabel.trim() || 'Score'
  const data = useMemo<Record<string, IranMapValue>>(
    () => ({
      ...demoData,
      ...valueOverrides,
      ...(demoMode === 'focus' && disabledProvinceValues[focusProvinceId] ? { [focusProvinceId]: null } : {}),
    }),
    [demoMode, disabledProvinceValues, focusProvinceId, valueOverrides],
  )
  const provinceCounties = useMemo(
    () => countyBoundaries.filter((county) => county.provinceId === focusProvinceId),
    [focusProvinceId],
  )
  const selectedCountyIds = provinceCounties.filter((county) => enabledCounties[county.id]).map((county) => county.id)

  const clearInspection = () => {
    setSelectedArea(null)
    setHoveredArea(null)
    setSelectedCapital(null)
    setSelectedIsland(null)
  }

  const activeMode = useMemo<IranMapMode>(
    () => (demoMode === 'mixed' || demoMode === 'focus' ? 'province' : demoMode),
    [demoMode],
  )
  const inspectedArea = hoveredArea || selectedArea
  const activeArea = inspectedArea
    ? {
        ...inspectedArea,
        value: Object.prototype.hasOwnProperty.call(data, inspectedArea.id)
          ? normalizeMapValue(data[inspectedArea.id])
          : inspectedArea.value,
      }
    : null
  const activeModeCopy = modes.find((mode) => mode.id === demoMode)
  const activeCapital = hoveredArea ? null : selectedCapital

  return (
    <main className='demo-shell'>
      <header className='masthead'>
        <div className='brand-lockup'>
          <span className='brand-mark' aria-hidden='true'>
            IR
          </span>
          <div>
            <p className='eyebrow'>React Iran Map / live demo</p>
            <h1>Layer lab</h1>
          </div>
        </div>
        <div className='coverage-index' aria-label='Map coverage'>
          <div>
            <strong>31</strong>
            <span>provinces</span>
          </div>
          <span className='coverage-arrow' aria-hidden='true'>
            →
          </span>
          <div>
            <strong>478</strong>
            <span>counties</span>
          </div>
        </div>
      </header>

      <section className='workbench'>
        <aside className='layer-panel' aria-label='Map controls'>
          <div className='panel-heading'>
            <p className='panel-kicker'>Layer mode</p>
            <p>Switch the same React component between administrative views.</p>
          </div>

          <div className='mode-list' role='radiogroup' aria-label='Map display mode'>
            {modes.map((mode, index) => (
              <button
                key={mode.id}
                type='button'
                role='radio'
                aria-checked={demoMode === mode.id}
                className={`mode-option ${demoMode === mode.id ? 'is-active' : ''}`}
                onClick={() => {
                  setDemoMode(mode.id)
                  clearInspection()
                }}
              >
                <span className='mode-number'>{String(index + 1).padStart(2, '0')}</span>
                <span>
                  <strong>{mode.label}</strong>
                  <small>{mode.caption}</small>
                </span>
                <span className='mode-indicator' aria-hidden='true' />
              </button>
            ))}
          </div>

          {demoMode === 'focus' && (
            <div className='focus-controls'>
              <label className='focus-picker'>
                <span className='panel-kicker'>Focused Ostan</span>
                <select
                  value={focusProvinceId}
                  onChange={(event) => {
                    setFocusProvinceId(event.target.value)
                    clearInspection()
                  }}
                >
                  {provinceBoundaries.map((province) => (
                    <option key={province.id} value={province.id}>
                      {province.name} — {province.faName}
                    </option>
                  ))}
                </select>
              </label>
              <label className='province-value-toggle'>
                <input
                  type='checkbox'
                  checked={!disabledProvinceValues[focusProvinceId]}
                  onChange={(event) => {
                    setDisabledProvinceValues((current) => ({ ...current, [focusProvinceId]: !event.target.checked }))
                    clearInspection()
                  }}
                />
                <span>Use province value</span>
              </label>
              <p className='province-value-help'>
                Turn off to leave the province gray and color only its selected counties.
              </p>
            </div>
          )}

          <div className='capital-control'>
            <div className='capital-control-heading'>
              <p className='panel-kicker'>Capital points</p>
              <span>31 / 484</span>
            </div>
            <div className='capital-options' role='radiogroup' aria-label='Capital marker layer'>
              {capitalLayers.map((layer) => (
                <button
                  key={layer.id}
                  type='button'
                  role='radio'
                  aria-checked={capitalLayer === layer.id}
                  className={capitalLayer === layer.id ? 'is-active' : ''}
                  onClick={() => setCapitalLayer(layer.id)}
                >
                  {layer.label}
                </button>
              ))}
            </div>
            <small>Context follows the current province or county view.</small>
          </div>

          <div className='capital-control geography-control'>
            <div className='capital-control-heading'>
              <p className='panel-kicker'>Geographic context</p>
              <span>3 seas + strait / 17 islands</span>
            </div>
            <div className='capital-options geography-options' role='radiogroup' aria-label='Geographic context layer'>
              <button
                type='button'
                role='radio'
                aria-checked={showGeography}
                className={showGeography ? 'is-active' : ''}
                onClick={() => setShowGeography(true)}
              >
                Full
              </button>
              <button
                type='button'
                role='radio'
                aria-checked={!showGeography}
                className={!showGeography ? 'is-active' : ''}
                onClick={() => setShowGeography(false)}
              >
                Boundaries
              </button>
            </div>
            <small>Physical coastlines replace maritime administrative envelopes.</small>
          </div>

          <div className='legend-block'>
            <label className='metric-picker'>
              <span className='panel-kicker'>Metric name</span>
              <input
                type='text'
                value={metricLabel}
                maxLength={60}
                placeholder='Score'
                onChange={(event) => setMetricLabel(event.target.value)}
              />
            </label>
            <label className='metric-picker'>
              <span className='panel-kicker'>Metric scale</span>
              <select
                value={bandScale}
                onChange={(event) => {
                  const scale = event.target.value as 'score' | 'numeric'
                  setBandScale(scale)
                  if (scale === 'score') setColorBands(defaultColorBands)
                }}
              >
                <option value='score'>Score: 0–100</option>
                <option value='numeric'>Numeric: custom x–y</option>
              </select>
            </label>
            {bandScale === 'numeric' && (
              <div className='metric-domain'>
                <label>
                  Domain minimum
                  <input
                    type='number'
                    step='any'
                    value={domainMin}
                    onChange={(event) => setDomainMin(Number(event.target.value))}
                  />
                </label>
                <label>
                  Domain maximum
                  <input
                    type='number'
                    step='any'
                    value={domainMax}
                    onChange={(event) => setDomainMax(Number(event.target.value))}
                  />
                </label>
              </div>
            )}
            <ScoreBands
              bands={colorBands}
              metricLabel={metricName}
              scale={bandScale}
              min={bandScale === 'score' ? 0 : domainMin}
              max={bandScale === 'score' ? 100 : domainMax}
              orientation='vertical'
            />
            <details className='demo-band-editor'>
              <summary>Edit bands</summary>
              <ScoreBands
                bands={colorBands}
                onChange={setColorBands}
                metricLabel={metricName}
                scale={bandScale}
                min={bandScale === 'score' ? 0 : domainMin}
                max={bandScale === 'score' ? 100 : domainMax}
                showNoData={false}
              />
            </details>
          </div>
        </aside>

        <div className={`map-stage${demoMode === 'focus' ? ' has-county-editor' : ''}`}>
          <div className='stage-meta'>
            <div>
              <span className='live-dot' aria-hidden='true' />
              <span>Live layer</span>
              <strong>{activeModeCopy?.label}</strong>
            </div>
            <p>
              {demoMode === 'mixed'
                ? 'Mashhad, Tehran and Shiraz are independently selectable.'
                : activeModeCopy?.caption}
            </p>
          </div>

          {demoMode === 'focus' && (
            <CountyEditor
              key={focusProvinceId}
              counties={provinceCounties}
              enabledCounties={enabledCounties}
              values={data}
              valueDrafts={valueDrafts}
              metricName={metricName}
              onToggle={(id, enabled) => {
                setEnabledCounties((current) => ({ ...current, [id]: enabled }))
                clearInspection()
              }}
              onToggleAll={(enabled) => {
                setEnabledCounties((current) => ({
                  ...current,
                  ...Object.fromEntries(provinceCounties.map((county) => [county.id, enabled])),
                }))
                clearInspection()
              }}
              onValueChange={(id, draft) => {
                setValueDrafts((current) => ({ ...current, [id]: draft }))
                const value = Number(draft)
                if (draft.trim() !== '' && Number.isFinite(value)) {
                  setValueOverrides((current) => ({ ...current, [id]: value }))
                }
              }}
              onNoDataChange={(id, noData) => {
                const draft = valueDrafts[id]
                const previousValue = draft?.trim() ? normalizeMapValue(Number(draft)) : undefined
                const value = previousValue ?? demoData[id]
                setValueOverrides((current) => ({ ...current, [id]: noData ? null : value }))
                if (!noData) setValueDrafts((current) => ({ ...current, [id]: String(value) }))
              }}
            />
          )}

          <div
            className='map-canvas'
            key={`${demoMode}-${
              demoMode === 'focus' ? `${focusProvinceId}-${!!disabledProvinceValues[focusProvinceId]}` : ''
            }`}
          >
            <IranMap
              mode={activeMode}
              focusProvince={demoMode === 'focus' ? focusProvinceId : undefined}
              regions={demoMode === 'region' ? regions : []}
              detailedCounties={
                demoMode === 'focus'
                  ? selectedCountyIds
                  : demoMode === 'mixed' || demoMode === 'region'
                    ? detailCounties
                    : []
              }
              data={data}
              colorBands={colorBands}
              width='100%'
              deactiveProvinceColor='#e6e6e6'
              selectedAreaColor='#123f4b'
              strokeColor='#f8faf7'
              strokeWidth={0.35}
              tooltipTitle={`${metricName}:`}
              capitalMarkers={capitalLayer}
              capitalMarkerColor='#123f4b'
              capitalMarkerSize={demoMode === 'county' ? 3.2 : 4}
              showLabels={demoMode === 'province' || demoMode === 'mixed' || demoMode === 'focus'}
              showWater={showGeography}
              showSeaLabels={showGeography}
              showIslands={showGeography}
              showIslandLabels={showGeography}
              onSelect={(area) => {
                setSelectedArea(area)
                setSelectedCapital(null)
                setSelectedIsland(null)
              }}
              onDeselect={clearInspection}
              onHover={setHoveredArea}
              onCapitalSelect={(capital) => {
                setSelectedCapital(capital)
                setSelectedArea(null)
                setSelectedIsland(null)
              }}
              onIslandSelect={(island) => {
                setSelectedIsland(island)
                setSelectedCapital(null)
              }}
              ariaLabel={`Iran map in ${activeModeCopy?.label.toLowerCase()} mode`}
            />
          </div>

          <footer className='inspection-strip' aria-live='polite'>
            <div>
              <span className='inspection-label'>
                {hoveredArea
                  ? 'Inspecting'
                  : selectedIsland
                    ? 'Iranian island'
                    : activeCapital
                      ? 'Capital point'
                      : selectedArea
                        ? 'Selected'
                        : 'Try the map'}
              </span>
              <strong>
                {selectedIsland
                  ? selectedIsland.name
                  : activeCapital
                    ? activeCapital.name
                    : activeArea
                      ? activeArea.name
                      : 'Hover or select an area'}
              </strong>
              <small lang='fa' dir='rtl'>
                {selectedIsland?.faName ||
                  activeCapital?.faName ||
                  activeArea?.faName ||
                  'استان‌ها و شهرستان‌ها تعاملی هستند'}
              </small>
            </div>
            <div className='score-readout'>
              <span>{activeCapital || selectedIsland ? 'Coordinates' : metricName}</span>
              {activeCapital || selectedIsland ? (
                <small>
                  {(activeCapital?.latitude || selectedIsland?.latitude)?.toFixed(4)}° N<br />
                  {(activeCapital?.longitude || selectedIsland?.longitude)?.toFixed(4)}° E
                </small>
              ) : (
                <strong>{activeArea ? (activeArea.value === undefined ? 'No data' : activeArea.value) : '—'}</strong>
              )}
            </div>
          </footer>
        </div>
      </section>
    </main>
  )
}

export default App
