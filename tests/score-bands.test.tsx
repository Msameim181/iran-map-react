import { describe, expect, it, vi } from 'vitest'
import React, { useState } from 'react'
import { fireEvent, render, within } from '@testing-library/react'
import { IranMap, ScoreBands } from '@msameim181/iran-map-react'
import type { IranMapColorBand } from '@msameim181/iran-map-react'

vi.mock('react-tooltip', () => ({ Tooltip: () => null }))

const initialBands: IranMapColorBand[] = [
  { max: 50, color: '#facc15', label: 'Low' },
  { min: 50, color: '#ef4444', label: 'High' },
]

describe('Standalone ScoreBands', () => {
  it('renders a read-only legend with range labels and no-data key anywhere', () => {
    const { getByText, queryByRole, container } = render(<ScoreBands bands={initialBands} />)
    expect(getByText('Score bands')).toBeTruthy()
    expect(getByText('0 – 100')).toBeTruthy()
    expect(getByText('Below 50')).toBeTruthy()
    expect(getByText('50 and above')).toBeTruthy()
    expect(getByText('No data')).toBeTruthy()
    expect(queryByRole('spinbutton')).toBeNull()
    expect(container.querySelector('svg')).toBeNull()
  })

  it('supports arbitrary negative and decimal numeric domains and formatted values', () => {
    const onChange = vi.fn()
    const { getByRole, getByText } = render(
      <ScoreBands
        bands={[{ min: -200.5, max: 1200.25, color: '#123456' }]}
        onChange={onChange}
        scale='numeric'
        min={-500}
        max={1500}
        metricLabel='Revenue'
        formatValue={(value) => `${value} USD`}
      />,
    )
    expect(getByText('-500 USD – 1500 USD')).toBeTruthy()
    const minimum = getByRole('spinbutton', { name: 'Minimum (inclusive)' }) as HTMLInputElement
    expect(minimum.min).toBe('')
    fireEvent.change(minimum, { target: { value: '-350.75' } })
    expect(onChange).toHaveBeenLastCalledWith([{ min: -350.75, max: 1200.25, color: '#123456' }])
  })

  it('does not commit reversed bounds or out-of-range score thresholds', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<ScoreBands bands={[{ min: 0, max: 50, color: '#123456' }]} onChange={onChange} />)
    const minimum = getByRole('spinbutton', { name: 'Minimum (inclusive)' })
    fireEvent.change(minimum, { target: { value: '60' } })
    expect(onChange).not.toHaveBeenCalled()
    expect(getByRole('alert')).toBeTruthy()
    fireEvent.change(minimum, { target: { value: '-10' } })
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.change(minimum, { target: { value: '20' } })
    expect(onChange).toHaveBeenLastCalledWith([{ min: 20, max: 50, color: '#123456' }])
  })

  it('supports unbounded intervals, labels, colors, and adding/removing bands', () => {
    const Harness = () => {
      const [bands, setBands] = useState(initialBands)
      return <ScoreBands bands={bands} onChange={setBands} />
    }
    const { getByRole, getAllByRole, getByText } = render(<Harness />)
    const firstBand = () => within(getByRole('group', { name: 'Band 1' }))
    fireEvent.change(firstBand().getByRole('spinbutton', { name: 'Maximum (exclusive)' }), { target: { value: '' } })
    expect(getByText('All values')).toBeTruthy()
    fireEvent.change(firstBand().getByRole('textbox', { name: 'Label' }), { target: { value: 'Custom category' } })
    expect(getByText('Custom category')).toBeTruthy()
    fireEvent.change(firstBand().getByLabelText('Color'), { target: { value: '#abcdef' } })
    fireEvent.click(getByRole('button', { name: 'Add band' }))
    expect(getAllByRole('group')).toHaveLength(3)
    fireEvent.click(getByRole('button', { name: 'Remove band 3' }))
    expect(getAllByRole('group')).toHaveLength(2)
  })

  it('shares controlled bands with the map and respects half-open endpoints including 0 and 100', () => {
    const Harness = () => {
      const [bands, setBands] = useState(initialBands)
      return (
        <>
          <ScoreBands bands={bands} onChange={setBands} />
          <IranMap data={{ tehran: 0, fars: 50, kerman: 100 }} colorBands={bands} />
        </>
      )
    }
    const { getByRole, getByTestId } = render(<Harness />)
    expect(getByTestId('iran-map-province-tehran').getAttribute('fill')).toBe('#facc15')
    expect(getByTestId('iran-map-province-fars').getAttribute('fill')).toBe('#ef4444')
    expect(getByTestId('iran-map-province-kerman').getAttribute('fill')).toBe('#ef4444')
    const firstBand = within(getByRole('group', { name: 'Band 1' }))
    fireEvent.change(firstBand.getByLabelText('Color'), { target: { value: '#abcdef' } })
    expect(getByTestId('iran-map-province-tehran').getAttribute('fill')).toBe('#abcdef')
  })

  it('supports vertical layout, custom no-data color, and an invalid display-domain message', () => {
    const { container, getByRole, getByText } = render(
      <ScoreBands
        bands={[]}
        orientation='vertical'
        min={100}
        max={0}
        noDataColor='#aaaaaa'
        noDataLabel='Unavailable'
      />,
    )
    expect(container.querySelector('.iran-score-bands-legend--vertical')).toBeTruthy()
    expect(getByText('Unavailable')).toBeTruthy()
    expect(getByRole('alert')).toBeTruthy()
    expect(getByText('No bands configured.')).toBeTruthy()
  })
})
