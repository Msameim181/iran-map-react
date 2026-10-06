import { describe, expect, it, vi } from 'vitest'
import React from 'react'
import { fireEvent, render } from '@testing-library/react'
import App from '../example/src/App'
import { countyBoundaries } from '@msameim181/iran-map-react/full'

// Test the demo controls and tooltip attributes without the overlay's asynchronous observers.
vi.mock('react-tooltip', () => ({ Tooltip: () => null }))

const renderFocus = () => {
  const view = render(<App />)
  fireEvent.click(view.getByRole('radio', { name: /Province focus/ }))
  return view
}

describe('Demo county controls', () => {
  it('clears the inspector after same-area and outside clicks without resetting county settings', () => {
    const { container, getByTestId, getByRole } = renderFocus()
    const area = getByTestId('iran-map-county-razaviKhorasan.mashhad')
    fireEvent.click(area)
    expect(container.querySelector('.inspection-strip > div > strong')?.textContent).toBe('Mashhad')
    fireEvent.click(area)
    expect(container.querySelector('.inspection-strip > div > strong')?.textContent).toBe('Hover or select an area')
    fireEvent.click(area)
    fireEvent.click(getByRole('textbox', { name: 'Metric name' }))
    expect(area.getAttribute('aria-pressed')).toBe('false')
    expect(container.querySelector('.score-readout strong')?.textContent).toBe('—')
    expect(container.querySelectorAll('[data-area-type="county"]')).toHaveLength(3)
    expect((getByRole('checkbox', { name: 'Show Mashhad' }) as HTMLInputElement).checked).toBe(true)
  })
  it('lists only the focused province counties and enables editable values for checked rows', () => {
    const { container, getAllByRole, getByRole } = renderFocus()
    const counties = countyBoundaries.filter((county) => county.provinceId === 'razaviKhorasan')

    expect(getAllByRole('checkbox', { name: /^Show / })).toHaveLength(counties.length)
    expect(container.querySelectorAll('[data-area-type="county"]')).toHaveLength(3)
    expect((getByRole('checkbox', { name: 'Show Mashhad' }) as HTMLInputElement).checked).toBe(true)
    for (const county of counties) {
      const enabled = (getByRole('checkbox', { name: `Show ${county.name}` }) as HTMLInputElement).checked
      const value = getByRole('spinbutton', { name: `${county.name} Score` }) as HTMLInputElement
      expect(value.disabled).toBe(!enabled)
    }
  })

  it('updates county colors, tooltip values, and already-selected inspection values immediately', () => {
    const { container, getByRole, getByTestId } = renderFocus()
    const input = getByRole('spinbutton', { name: 'Mashhad Score' })
    const path = () => getByTestId('iran-map-county-razaviKhorasan.mashhad')

    fireEvent.change(input, { target: { value: '88.5' } })
    expect(path().getAttribute('fill')).toBe('#a93f46')
    expect(path().getAttribute('aria-label')).toContain('Score: 88.5')
    fireEvent.click(path())
    expect(container.querySelector('.score-readout strong')?.textContent).toBe('88.5')
    fireEvent.change(input, { target: { value: '0' } })
    expect(container.querySelector('.score-readout strong')?.textContent).toBe('0')
    expect(path().getAttribute('aria-label')).toContain('Score: 0')
    fireEvent.change(input, { target: { value: '-12.25' } })
    expect(container.querySelector('.score-readout strong')?.textContent).toBe('-12.25')
  })

  it('retains the last valid value while an input is empty', () => {
    const { getByRole, getByTestId } = renderFocus()
    const input = getByRole('spinbutton', { name: 'Mashhad Score' })
    fireEvent.change(input, { target: { value: '60' } })
    fireEvent.change(input, { target: { value: '' } })

    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(getByTestId('iran-map-county-razaviKhorasan.mashhad').getAttribute('aria-label')).toContain('Score: 60')
    expect(getByRole('status').textContent).toContain('last valid value')
    fireEvent.change(input, { target: { value: '70' } })
    expect(input.getAttribute('aria-invalid')).toBe('false')
    expect(getByTestId('iran-map-county-razaviKhorasan.mashhad').getAttribute('fill')).toBe('#e47b58')
  })

  it('preserves each province selections and values and scopes bulk actions to the current province', () => {
    const { container, getByLabelText, getByRole, getByTestId, getByText } = renderFocus()
    const county = countyBoundaries.find((item) => item.provinceId === 'tehran')!
    const tehranCount = countyBoundaries.filter((item) => item.provinceId === 'tehran').length
    const picker = getByLabelText('Focused Ostan')

    fireEvent.change(picker, { target: { value: 'tehran' } })
    expect(container.querySelectorAll('[data-area-type="county"]')).toHaveLength(0)
    fireEvent.click(getByRole('checkbox', { name: `Show ${county.name}` }))
    fireEvent.change(getByRole('spinbutton', { name: `${county.name} Score` }), { target: { value: '73' } })
    expect(getByTestId(`iran-map-county-${county.id}`).getAttribute('aria-label')).toContain('Score: 73')

    fireEvent.change(picker, { target: { value: 'razaviKhorasan' } })
    expect(container.querySelectorAll('[data-area-type="county"]')).toHaveLength(3)
    fireEvent.change(picker, { target: { value: 'tehran' } })
    expect(container.querySelectorAll('[data-area-type="county"]')).toHaveLength(1)
    expect((getByRole('spinbutton', { name: `${county.name} Score` }) as HTMLInputElement).value).toBe('73')

    fireEvent.change(getByRole('searchbox', { name: 'Find a county' }), { target: { value: county.name } })
    fireEvent.click(getByRole('button', { name: 'Enable all counties' }))
    expect(container.querySelectorAll('[data-area-type="county"]')).toHaveLength(tehranCount)
    expect(getByText(`${tehranCount} of ${tehranCount} counties enabled`)).toBeTruthy()
    fireEvent.click(getByRole('button', { name: 'Clear selection' }))
    expect(container.querySelectorAll('[data-area-type="county"]')).toHaveLength(0)
    expect(container.querySelectorAll('[data-area-type="province"]')).toHaveLength(1)
    fireEvent.change(picker, { target: { value: 'razaviKhorasan' } })
    expect(container.querySelectorAll('[data-area-type="county"]')).toHaveLength(3)
  })

  it('searches English and Persian county names without disabling hidden selections', () => {
    const { container, getByRole, getAllByRole, getByText } = renderFocus()
    const search = getByRole('searchbox', { name: 'Find a county' })
    fireEvent.change(search, { target: { value: 'مشهد' } })
    expect(getAllByRole('checkbox', { name: /^Show / })).toHaveLength(1)
    expect(getByRole('checkbox', { name: 'Show Mashhad' })).toBeTruthy()
    fireEvent.change(search, { target: { value: 'mAsHhAd' } })
    expect(getAllByRole('checkbox', { name: /^Show / })).toHaveLength(1)
    fireEvent.change(search, { target: { value: 'no such county' } })
    expect(getByText(/No counties match/)).toBeTruthy()
    expect(container.querySelectorAll('[data-area-type="county"]')).toHaveLength(3)
  })

  it('renames the metric consistently and falls back to Score for a blank name', () => {
    const { container, getByRole, getByTestId } = renderFocus()
    const label = getByRole('textbox', { name: 'Metric name' })
    fireEvent.change(label, { target: { value: 'Population' } })

    expect(getByRole('spinbutton', { name: 'Mashhad Population' })).toBeTruthy()
    expect(container.querySelector('.legend-block > .iran-score-bands h2')?.textContent).toBe('Population bands')
    expect(getByTestId('iran-map-county-razaviKhorasan.mashhad').getAttribute('aria-label')).toContain('Population: 92')
    expect(container.querySelector('.score-readout > span')?.textContent).toBe('Population')
    fireEvent.click(getByRole('radio', { name: /Counties 478/ }))
    expect(getByTestId('iran-map-county-razaviKhorasan.mashhad').getAttribute('aria-label')).toContain('Population: 92')
    fireEvent.change(label, { target: { value: '   ' } })
    expect(getByTestId('iran-map-county-razaviKhorasan.mashhad').getAttribute('aria-label')).toContain('Score: 92')
  })

  it('turns the focused province gray without removing county detail and restores its value', () => {
    const { container, getByRole, getByTestId } = renderFocus()
    const toggle = getByRole('checkbox', { name: 'Use province value' })
    const province = () => getByTestId('iran-map-province-razaviKhorasan')
    const originalFill = province().getAttribute('fill')
    fireEvent.click(toggle)
    expect(province().getAttribute('fill')).toBe('#e6e6e6')
    expect(container.querySelectorAll('[data-area-type="county"]')).toHaveLength(3)
    fireEvent.click(province())
    expect(province().getAttribute('fill')).toBe('#e6e6e6')
    expect(container.querySelector('.score-readout strong')?.textContent).toBe('No data')
    fireEvent.click(toggle)
    expect(province().getAttribute('fill')).toBe(originalFill)
  })

  it('keeps no-data counties visible and gray and restores the last custom value', () => {
    const { getByRole, getByTestId } = renderFocus()
    const value = getByRole('spinbutton', { name: 'Mashhad Score' }) as HTMLInputElement
    const noData = getByRole('checkbox', { name: 'Mashhad has no data' })
    const path = () => getByTestId('iran-map-county-razaviKhorasan.mashhad')
    fireEvent.change(value, { target: { value: '55.5' } })
    fireEvent.click(noData)
    expect(value.disabled).toBe(true)
    expect(path().getAttribute('fill')).toBe('#e6e6e6')
    expect(path().getAttribute('aria-label')).toContain('No data')
    expect((getByRole('checkbox', { name: 'Show Mashhad' }) as HTMLInputElement).checked).toBe(true)
    fireEvent.click(noData)
    expect(value.disabled).toBe(false)
    expect(path().getAttribute('aria-label')).toContain('55.5')
    fireEvent.change(value, { target: { value: '-1' } })
    expect(path().getAttribute('fill')).toBe('#e6e6e6')
    expect((noData as HTMLInputElement).checked).toBe(true)
  })
})
