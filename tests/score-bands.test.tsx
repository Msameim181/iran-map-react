import { describe, expect, it, vi } from 'vitest'
import React, { useState } from 'react'
import { fireEvent, render, within } from '@testing-library/react'
import { IranMap, ScoreBands } from '@msameim181/iran-map-react/full'
import type { IranMapColorBand } from '@msameim181/iran-map-react/full'

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
    fireEvent.blur(minimum)
    expect(onChange).toHaveBeenLastCalledWith([{ min: -350.75, max: 1200.25, color: '#123456' }])
  })

  it('does not commit reversed bounds or out-of-range score thresholds', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<ScoreBands bands={[{ min: 0, max: 50, color: '#123456' }]} onChange={onChange} />)
    const minimum = getByRole('spinbutton', { name: 'Minimum (inclusive)' })
    fireEvent.change(minimum, { target: { value: '60' } })
    fireEvent.blur(minimum)
    expect(onChange).not.toHaveBeenCalled()
    expect(getByRole('alert')).toBeTruthy()
    fireEvent.change(minimum, { target: { value: '-10' } })
    fireEvent.blur(minimum)
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.change(minimum, { target: { value: '20' } })
    fireEvent.blur(minimum)
    expect(onChange).toHaveBeenLastCalledWith([{ min: 20, max: 50, color: '#123456' }])
  })

  it('supports unbounded intervals, labels, colors, and adding/removing bands', () => {
    const Harness = () => {
      const [bands, setBands] = useState(initialBands)
      return <ScoreBands bands={bands} onChange={setBands} />
    }
    const { getByRole, getAllByRole, getByText } = render(<Harness />)
    const firstBand = () => within(getByRole('group', { name: 'Band 1' }))
    const maximum = firstBand().getByRole('spinbutton', { name: 'Maximum (exclusive)' })
    fireEvent.change(maximum, { target: { value: '' } })
    fireEvent.blur(maximum)
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

  describe('typing', () => {
    const bands: IranMapColorBand[] = [
      { max: 25, color: '#111111', label: 'Low' },
      { min: 25, max: 50, color: '#222222', label: 'Mid' },
    ]

    it('keeps typed text as a draft and commits only on blur', () => {
      const onChange = vi.fn()
      const { getAllByRole } = render(<ScoreBands bands={bands} onChange={onChange} />)
      const maximum = getAllByRole('spinbutton', { name: 'Maximum (exclusive)' })[0] as HTMLInputElement
      fireEvent.change(maximum, { target: { value: '3' } })
      fireEvent.change(maximum, { target: { value: '30' } })
      expect(maximum.value).toBe('30')
      expect(onChange).not.toHaveBeenCalled()
      fireEvent.blur(maximum)
      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange).toHaveBeenCalledWith([{ max: 30, color: '#111111', label: 'Low' }, bands[1]])
    })

    it('commits on Enter and treats a blank bound as unbounded only when committed', () => {
      const onChange = vi.fn()
      const { getAllByRole } = render(<ScoreBands bands={bands} onChange={onChange} />)
      const maximum = getAllByRole('spinbutton', { name: 'Maximum (exclusive)' })[0]
      fireEvent.change(maximum, { target: { value: '' } })
      expect(onChange).not.toHaveBeenCalled()
      fireEvent.keyDown(maximum, { key: 'Enter' })
      expect(onChange).toHaveBeenCalledWith([{ color: '#111111', label: 'Low' }, bands[1]])
    })

    it('marks an invalid draft and keeps the previous bands', () => {
      const onChange = vi.fn()
      const { getAllByRole, getByRole } = render(<ScoreBands bands={bands} onChange={onChange} />)
      const maximum = getAllByRole('spinbutton', { name: 'Maximum (exclusive)' })[0]
      fireEvent.change(maximum, { target: { value: '150' } })
      expect(maximum.getAttribute('aria-invalid')).toBe('true')
      expect(getByRole('alert')).toBeTruthy()
      fireEvent.blur(maximum)
      expect(onChange).not.toHaveBeenCalled()
    })

    it("keeps another band's draft when a band is removed", () => {
      const Harness = () => {
        const [current, setCurrent] = useState(bands)
        return <ScoreBands bands={current} onChange={setCurrent} />
      }
      const { getAllByRole, getByRole } = render(<Harness />)
      fireEvent.change(getAllByRole('spinbutton', { name: 'Maximum (exclusive)' })[1], { target: { value: '60' } })
      fireEvent.click(getByRole('button', { name: 'Remove band 1' }))
      expect((getAllByRole('spinbutton', { name: 'Maximum (exclusive)' })[0] as HTMLInputElement).value).toBe('60')
    })

    it('adds an open-ended band from the domain minimum', () => {
      const onChange = vi.fn()
      const { getByRole } = render(<ScoreBands bands={bands} onChange={onChange} min={10} max={90} scale='numeric' />)
      fireEvent.click(getByRole('button', { name: 'Add band' }))
      const added = onChange.mock.calls[0][0][2]
      expect(added.min).toBe(10)
      expect(added.max).toBeUndefined()
    })

    it('ignores partial number-input text (badInput) so a sibling blur cannot commit it as unbounded', () => {
      const onChange = vi.fn()
      const { getAllByRole } = render(<ScoreBands bands={bands} onChange={onChange} />)
      const minimum = getAllByRole('spinbutton', { name: 'Minimum (inclusive)' })[1]
      const maximum = getAllByRole('spinbutton', { name: 'Maximum (exclusive)' })[1] as HTMLInputElement
      // A browser reports '' with badInput while the user is typing "-" or "3-0".
      Object.defineProperty(maximum, 'validity', { value: { badInput: true } })
      fireEvent.change(maximum, { target: { value: '' } })
      // Controlled value stays '' (not the old bound), so React does not clobber what the user is typing.
      expect(maximum.value).toBe('')
      expect(maximum.getAttribute('aria-invalid')).toBe('true')
      fireEvent.blur(maximum)
      expect(onChange).not.toHaveBeenCalled()
      fireEvent.change(minimum, { target: { value: '30' } })
      fireEvent.blur(minimum)
      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange).toHaveBeenCalledWith([bands[0], { min: 30, max: 50, color: '#222222', label: 'Mid' }])
    })
  })
})
