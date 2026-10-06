import { describe, expect, it, vi } from 'vitest'
import React from 'react'
import { fireEvent, render } from '@testing-library/react'
import { IranMap } from '@msameim181/iran-map-react/full'
import type { IranMapValue } from '@msameim181/iran-map-react/full'

vi.mock('react-tooltip', () => ({ Tooltip: () => null }))

describe('Map no-data values', () => {
  it.each<IranMapValue>([null, undefined, -1, NaN, Infinity, -Infinity])(
    'renders %s as gray in province and county views',
    (value) => {
      for (const mode of ['province', 'county'] as const) {
        const id = mode === 'province' ? 'tehran' : 'tehran.tehran'
        const { getByTestId, unmount } = render(
          <IranMap
            mode={mode}
            data={{ [id]: value }}
            colorBands={[{ color: '#ff0000' }]}
            selectedAreaColor='#00ff00'
          />,
        )
        const area = getByTestId(`iran-map-${mode}-${id}`)
        expect(area.getAttribute('fill')).toBe('#e6e6e6')
        expect(area.getAttribute('aria-label')).toContain('No data')
        fireEvent.click(area)
        expect(area.getAttribute('fill')).toBe('#e6e6e6')
        unmount()
      }
    },
  )

  it('colors zero as valid data with explicit bands and the automatic gradient', () => {
    const view = render(<IranMap data={{ tehran: 0 }} />)
    expect(view.getByTestId('iran-map-province-tehran').getAttribute('fill')).not.toBe('#e6e6e6')
    view.rerender(<IranMap data={{ tehran: 0 }} colorBands={[{ max: 50, color: '#00ff00' }]} />)
    expect(view.getByTestId('iran-map-province-tehran').getAttribute('fill')).toBe('#00ff00')
  })

  it('excludes missing values from automatic gradient limits', () => {
    const view = render(<IranMap data={{ tehran: 50, fars: 100, bushehr: -1, kerman: null }} />)
    const fill = view.getByTestId('iran-map-province-tehran').getAttribute('fill')
    view.rerender(<IranMap data={{ tehran: 50, fars: 100 }} />)
    expect(view.getByTestId('iran-map-province-tehran').getAttribute('fill')).toBe(fill)
  })

  it('respects an explicit missing primary value over secondary aliases', () => {
    const { getByTestId } = render(<IranMap data={{ tehran: null, Tehran: 80, تهران: 60 }} />)
    expect(getByTestId('iran-map-province-tehran').getAttribute('fill')).toBe('#e6e6e6')
  })

  it('excludes missing region members but includes zero in the average', () => {
    const { getAllByTestId } = render(
      <IranMap
        mode='region'
        regionAggregation='average'
        regions={[{ id: 'sample', name: 'Sample', provinces: ['tehran', 'fars', 'bushehr', 'kerman'] }]}
        data={{ tehran: 10, fars: 0, bushehr: -1, kerman: null }}
      />,
    )
    for (const path of getAllByTestId('iran-map-region-sample')) {
      expect(path.getAttribute('aria-label')).toContain('5')
      expect(path.getAttribute('fill')).not.toBe('#e6e6e6')
    }
  })

  it.each([null, -1])('does not aggregate over an explicitly missing region value (%s)', (value) => {
    const { getAllByTestId } = render(
      <IranMap
        mode='region'
        regions={[{ id: 'sample', name: 'Sample', provinces: ['tehran', 'fars'] }]}
        data={{ sample: value, tehran: 80, fars: 90 }}
      />,
    )
    for (const path of getAllByTestId('iran-map-region-sample')) expect(path.getAttribute('fill')).toBe('#e6e6e6')
  })

  it('keeps independent islands gray when their administrative owner has no data', () => {
    const { getByTestId } = render(<IranMap data={{ hormozgan: null }} selectedAreaColor='#00ff00' />)
    const island = getByTestId('iran-map-island-qeshm')
    const shape = island.querySelector('.iran-map-island-shape')!
    expect(shape.getAttribute('fill')).toBe('#e6e6e6')
    fireEvent.click(island)
    expect(shape.getAttribute('fill')).toBe('#e6e6e6')
  })
})
