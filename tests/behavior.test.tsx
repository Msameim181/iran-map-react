import { describe, expect, it, vi } from 'vitest'
import React, { StrictMode } from 'react'
import { fireEvent, render } from '@testing-library/react'
import axe from 'axe-core'
import { countyBoundaries } from '@msameim181/iran-map-core/counties'
import { IranMap } from '@msameim181/iran-map-react'
import { IranMap as FullMap } from '@msameim181/iran-map-react/full'

vi.mock('react-tooltip', () => ({ Tooltip: ({ id }: { id?: string }) => <div data-testid='tooltip-host' id={id} /> }))

const data = { tehran: 60, fars: 80, 'tehran.tehran': 75 }

describe('selection policy', () => {
  it('survives StrictMode double mounting without spurious callbacks', () => {
    const onDeselect = vi.fn()
    const onSelect = vi.fn()
    const { getByTestId } = render(
      <StrictMode>
        <IranMap data={data} defaultSelectedArea='tehran' onSelect={onSelect} onDeselect={onDeselect} />
      </StrictMode>,
    )
    expect(getByTestId('iran-map-province-tehran').getAttribute('aria-pressed')).toBe('true')
    expect(onDeselect).not.toHaveBeenCalled()
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('prefers defaultSelectedArea over the legacy defaultSelectedProvince', () => {
    const { getByTestId } = render(<IranMap data={data} defaultSelectedArea='fars' defaultSelectedProvince='tehran' />)
    expect(getByTestId('iran-map-province-fars').getAttribute('aria-pressed')).toBe('true')
    expect(getByTestId('iran-map-province-tehran').getAttribute('aria-pressed')).toBe('false')
  })

  it('drops a default selection that is not in the model silently', () => {
    const onDeselect = vi.fn()
    const { container } = render(<IranMap data={data} defaultSelectedArea='nowhere' onDeselect={onDeselect} />)
    expect(container.querySelector('[aria-pressed="true"]')).toBeNull()
    expect(onDeselect).not.toHaveBeenCalled()
  })

  it('clears a selection once, with onDeselect, when its area leaves the model', () => {
    const onDeselect = vi.fn()
    const { getByTestId, rerender, container } = render(<FullMap mode='county' data={data} onDeselect={onDeselect} />)
    fireEvent.click(getByTestId('iran-map-county-tehran.tehran'))
    rerender(<FullMap mode='province' data={data} onDeselect={onDeselect} />)
    expect(container.querySelector('[aria-pressed="true"]')).toBeNull()
    expect(onDeselect).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['county', { mode: 'county' as const }, 'iran-map-county-tehran.tehran'],
    [
      'region',
      { mode: 'region' as const, regions: [{ id: 'g', name: 'G', provinces: ['tehran'] }] },
      'iran-map-region-g',
    ],
  ])('does not call selectProvinceHandler when a %s is deselected', (_name, props, testId) => {
    const selectProvinceHandler = vi.fn()
    const { getByTestId } = render(
      <FullMap data={{ ...data, g: 5 }} selectProvinceHandler={selectProvinceHandler} {...props} />,
    )
    fireEvent.click(getByTestId(testId))
    fireEvent.click(getByTestId(testId))
    expect(selectProvinceHandler).not.toHaveBeenCalled()
  })

  it('calls selectProvinceHandler for a province select and deselect', () => {
    const selectProvinceHandler = vi.fn()
    const { getByTestId } = render(<IranMap data={data} selectProvinceHandler={selectProvinceHandler} />)
    fireEvent.click(getByTestId('iran-map-province-tehran'))
    fireEvent.click(getByTestId('iran-map-province-tehran'))
    expect(selectProvinceHandler).toHaveBeenNthCalledWith(1, expect.objectContaining({ name: 'tehran' }))
    expect(selectProvinceHandler).toHaveBeenNthCalledWith(2, { name: undefined, faName: undefined })
  })

  it('stops listening to document clicks once nothing is selected', () => {
    const add = vi.spyOn(Document.prototype, 'addEventListener')
    const remove = vi.spyOn(Document.prototype, 'removeEventListener')
    const { getByTestId } = render(<IranMap data={data} />)
    const clickListeners = (spy: typeof add) => spy.mock.calls.filter(([type]) => type === 'click').length
    fireEvent.click(getByTestId('iran-map-province-tehran'))
    expect(clickListeners(add)).toBeGreaterThan(0)
    fireEvent.click(getByTestId('iran-map-province-tehran'))
    expect(clickListeners(remove)).toBeGreaterThanOrEqual(clickListeners(add))
    add.mockRestore()
    remove.mockRestore()
  })

  it('Escape clears the selection', () => {
    const onDeselect = vi.fn()
    const { getByTestId } = render(<IranMap data={data} onDeselect={onDeselect} />)
    const area = getByTestId('iran-map-province-tehran')
    fireEvent.click(area)
    fireEvent.keyDown(area, { key: 'Escape' })
    expect(area.getAttribute('aria-pressed')).toBe('false')
    expect(onDeselect).toHaveBeenCalledTimes(1)
  })
})

describe('catalogs prop', () => {
  it('keeps default catalogs for fields it does not set', () => {
    const { container } = render(
      <IranMap data={{}} capitalMarkers='province' catalogs={{ counties: countyBoundaries }} mode='county' />,
    )
    expect(container.querySelectorAll('[data-area-type="county"]')).toHaveLength(countyBoundaries.length)
    expect(container.querySelectorAll('[data-capital-type="province"]')).toHaveLength(31)
  })

  it('does not rebuild the model for an inline catalogs object with the same fields', () => {
    const counties = countyBoundaries.slice(0, 5)
    const { container, rerender } = render(<IranMap data={{}} mode='county' catalogs={{ counties }} />)
    const first = container.querySelector('[data-area-type="county"]')
    rerender(<IranMap data={{}} mode='county' catalogs={{ counties }} />)
    expect(container.querySelector('[data-area-type="county"]')).toBe(first)
    expect(container.querySelectorAll('[data-area-type="county"]')).toHaveLength(5)
  })
})

describe('islands and capitals', () => {
  it('reports the island and its owner to onIslandSelect', () => {
    const onIslandSelect = vi.fn()
    const { getByTestId } = render(<FullMap data={data} onIslandSelect={onIslandSelect} />)
    fireEvent.click(getByTestId('iran-map-island-qeshm'))
    const [island, area] = onIslandSelect.mock.calls[0]
    expect(island).toEqual(expect.objectContaining({ id: 'qeshm', provinceId: 'hormozgan' }))
    expect(island).not.toHaveProperty('area')
    expect(area).toEqual(expect.objectContaining({ id: 'hormozgan', type: 'province' }))
    expect(area).not.toHaveProperty('path')
  })

  it('activates islands and capitals from the keyboard', () => {
    const onIslandSelect = vi.fn()
    const onCapitalSelect = vi.fn()
    const { getByTestId } = render(
      <FullMap
        data={data}
        capitalMarkers='province'
        onIslandSelect={onIslandSelect}
        onCapitalSelect={onCapitalSelect}
      />,
    )
    fireEvent.keyDown(getByTestId('iran-map-island-qeshm'), { key: 'Enter' })
    expect(onIslandSelect).toHaveBeenCalledTimes(1)
    const capital = getByTestId('iran-map-capital-province-tehran')
    fireEvent.keyDown(capital, { key: ' ' })
    expect(onCapitalSelect).not.toHaveBeenCalled()
    fireEvent.keyUp(capital, { key: ' ' })
    expect(onCapitalSelect).toHaveBeenCalledTimes(1)
  })

  it('ignores key repeat and a Space release that did not start on the element', () => {
    const onSelect = vi.fn()
    const { getByTestId } = render(<IranMap data={data} onSelect={onSelect} />)
    const area = getByTestId('iran-map-province-tehran')
    fireEvent.keyUp(area, { key: ' ' })
    expect(onSelect).not.toHaveBeenCalled()
    fireEvent.keyDown(area, { key: ' ' })
    fireEvent.keyDown(area, { key: ' ', repeat: true })
    fireEvent.keyDown(area, { key: ' ', repeat: true })
    fireEvent.keyUp(area, { key: ' ' })
    expect(onSelect).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(area, { key: 'Enter' })
    fireEvent.keyDown(area, { key: 'Enter', repeat: true })
    expect(onSelect).toHaveBeenCalledTimes(1) // second Enter toggled it off; the repeat did nothing
  })

  it('renders capital markers without a handler as non-focusable decoration', () => {
    const { getByTestId, rerender } = render(<IranMap data={data} capitalMarkers='province' />)
    const marker = getByTestId('iran-map-capital-province-tehran')
    expect(marker.getAttribute('tabindex')).toBeNull()
    expect(marker.getAttribute('role')).toBeNull()
    rerender(<IranMap data={data} capitalMarkers='province' onCapitalSelect={() => undefined} />)
    expect(getByTestId('iran-map-capital-province-tehran').getAttribute('role')).toBe('button')
  })
})

describe('tooltip', () => {
  it('uses a unique tooltip id per map instance, on anchors and host', () => {
    const { container } = render(
      <>
        <IranMap data={data} />
        <IranMap data={data} />
      </>,
    )
    const hosts = [...container.querySelectorAll('[data-testid="tooltip-host"]')].map((el) => el.id)
    expect(new Set(hosts).size).toBe(2)
    const maps = container.querySelectorAll('.iran-map')
    hosts.forEach((id, index) => {
      expect(maps[index].querySelector('[data-area-type]')?.getAttribute('data-tooltip-id')).toBe(id)
    })
  })

  it('accepts a fixed tooltipId and can drop the tooltip entirely', () => {
    const { container, rerender } = render(<IranMap data={data} tooltipId='my-tip' />)
    expect(container.querySelector('#my-tip')).toBeTruthy()
    rerender(<IranMap data={data} tooltip={false} />)
    expect(container.querySelector('[data-testid="tooltip-host"]')).toBeNull()
    expect(container.querySelector('[data-tooltip-id]')).toBeNull()
    expect(container.querySelector('[aria-label]')).toBeTruthy()
  })
})

describe('accessibility', () => {
  it('exposes the svg as a labelled group and passes axe', async () => {
    const { container } = render(<FullMap data={data} capitalMarkers='province' onCapitalSelect={() => undefined} />)
    expect(container.querySelector('svg')?.getAttribute('role')).toBe('group')
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
    expect(results.violations.map((violation) => `${violation.id}: ${violation.nodes.length}`)).toEqual([])
  })
})
