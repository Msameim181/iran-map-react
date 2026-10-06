// @vitest-environment node
import { describe, expect, it } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { IranMap, ScoreBands } from '@msameim181/iran-map-react'
import { IranMap as FullMap } from '@msameim181/iran-map-react/full'

// Real react-tooltip (no mock) and no DOM: server rendering must not touch window/document or CSS files.
describe('server rendering', () => {
  it('renders the lean map to a string', () => {
    const html = renderToString(<IranMap data={{ tehran: 40 }} />)
    expect(html).toContain('data-testid="iran-map-province-tehran"')
    expect(html).toContain('role="group"')
  })

  it('renders the full map with a stable tooltip id', () => {
    const html = renderToString(<FullMap mode='county' data={{}} tooltipId='ssr-tip' />)
    expect(html).toContain('data-tooltip-id="ssr-tip"')
    expect(html).toContain('data-island-id="qeshm"')
  })

  it('renders ScoreBands', () => {
    expect(renderToString(<ScoreBands bands={[{ max: 50, color: '#f00' }]} />)).toContain('iran-score-bands')
  })
})
