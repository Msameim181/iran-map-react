import { describe, expect, it, vi } from 'vitest'
import React from 'react'
import { fireEvent, render } from '@testing-library/react'
import { countyBoundaries } from '@msameim181/iran-map-core/counties'
import { IranMap, createIranMap, provinceBoundaries, provinceCapitalMarkers } from '@msameim181/iran-map-react'

vi.mock('react-tooltip', () => ({ Tooltip: () => null }))

describe('Lean root entry (provinces only)', () => {
  it('renders the province map and selects an area', () => {
    const onSelect = vi.fn()
    const { container, getByTestId } = render(<IranMap data={{ tehran: 55 }} onSelect={onSelect} />)

    expect(container.querySelectorAll('[data-area-type="province"]')).toHaveLength(31)
    fireEvent.click(getByTestId('iran-map-province-tehran'))
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'tehran', type: 'province', value: 55 }))
  })

  it('renders province capitals but no seas or islands by default', () => {
    const { container } = render(<IranMap data={{}} capitalMarkers='province' />)

    expect(container.querySelectorAll('[data-capital-type="province"]')).toHaveLength(provinceCapitalMarkers.length)
    expect(container.querySelectorAll('[data-island-id]')).toHaveLength(0)
    expect(container.querySelectorAll('[data-water-id]')).toHaveLength(0)
  })

  it('skips county areas and warns once in development when the counties catalog is missing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const first = render(<IranMap mode='county' data={{}} />)
    first.rerender(<IranMap mode='county' data={{ tehran: 1 }} />)

    expect(first.container.querySelectorAll('[data-area-type="county"]')).toHaveLength(0)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('counties')
    warn.mockRestore()
  })

  it('accepts a catalogs prop to opt into counties', () => {
    const { container, getByTestId } = render(
      <IranMap
        mode='county'
        data={{ 'razaviKhorasan.mashhad': 80 }}
        catalogs={{ provinces: provinceBoundaries, counties: countyBoundaries }}
      />,
    )

    expect(container.querySelectorAll('[data-area-type="county"]')).toHaveLength(countyBoundaries.length)
    expect(getByTestId('iran-map-county-razaviKhorasan.mashhad')).toBeTruthy()
  })

  it('createIranMap binds a custom default catalog set', () => {
    const Custom = createIranMap({ provinces: provinceBoundaries.slice(0, 3) })
    const { container } = render(<Custom data={{}} />)

    expect(container.querySelectorAll('[data-area-type="province"]')).toHaveLength(3)
  })
})
