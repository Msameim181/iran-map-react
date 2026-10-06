import { describe, expect, it, vi } from 'vitest'
import React from 'react'
import { fireEvent, render } from '@testing-library/react'
import { IranMap } from '@msameim181/iran-map-react'

vi.mock('react-tooltip', () => ({ Tooltip: () => null }))

const data = { tehran: 60, fars: 80, 'tehran.tehran': 75 }
const bands = [{ color: '#abcdef' }]

describe('Dismissible map selection', () => {
  it.each(['province', 'county'] as const)(
    'toggles the same %s off and notifies without changing onSelect arguments',
    (mode) => {
      const onSelect = vi.fn()
      const onDeselect = vi.fn()
      const onHover = vi.fn()
      const { getByTestId } = render(
        <IranMap
          mode={mode}
          data={data}
          colorBands={bands}
          selectedAreaColor='#123f4b'
          onSelect={onSelect}
          onDeselect={onDeselect}
          onHover={onHover}
        />,
      )
      const id = mode === 'province' ? 'tehran' : 'tehran.tehran'
      const area = getByTestId(`iran-map-${mode}-${id}`)
      fireEvent.click(area)
      expect(area.getAttribute('fill')).toBe('#123f4b')
      expect(area.getAttribute('aria-pressed')).toBe('true')
      fireEvent.click(area)
      expect(area.getAttribute('fill')).toBe('#abcdef')
      expect(area.getAttribute('aria-pressed')).toBe('false')
      expect(onSelect).toHaveBeenCalledTimes(1)
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id, type: mode }))
      expect(onDeselect).toHaveBeenCalledTimes(1)
      expect(onHover).toHaveBeenLastCalledWith(null)
    },
  )

  it('moves selection directly to another area without deselecting it through the document listener', () => {
    const onDeselect = vi.fn()
    const { getByTestId } = render(
      <IranMap data={data} colorBands={bands} selectedAreaColor='#123f4b' onDeselect={onDeselect} />,
    )
    const first = getByTestId('iran-map-province-tehran')
    const second = getByTestId('iran-map-province-fars')
    fireEvent.click(first)
    fireEvent.click(second)
    expect(first.getAttribute('fill')).toBe('#abcdef')
    expect(second.getAttribute('fill')).toBe('#123f4b')
    expect(onDeselect).not.toHaveBeenCalled()
  })

  it.each(['outside', 'background', 'water', 'label'] as const)('clears selection on a %s click', (target) => {
    const onDeselect = vi.fn()
    const { container, getByTestId } = render(
      <IranMap data={data} colorBands={bands} selectedAreaColor='#123f4b' onDeselect={onDeselect} />,
    )
    const area = getByTestId('iran-map-province-tehran')
    fireEvent.click(area)
    const node =
      target === 'outside'
        ? document.body
        : target === 'background'
          ? container.querySelector('svg')!
          : target === 'water'
            ? container.querySelector('[data-water-id]')!
            : container.querySelector('.iran-map-label')!
    fireEvent.click(node)
    expect(area.getAttribute('fill')).toBe('#abcdef')
    expect(onDeselect).toHaveBeenCalledTimes(1)
    fireEvent.click(document.body)
    expect(onDeselect).toHaveBeenCalledTimes(1)
  })

  it('supports keyboard toggling and dismissing a default selection', () => {
    const { getByTestId } = render(
      <IranMap data={data} colorBands={bands} selectedAreaColor='#123f4b' defaultSelectedProvince='tehran' />,
    )
    const area = getByTestId('iran-map-province-tehran')
    expect(area.getAttribute('aria-pressed')).toBe('true')
    fireEvent.keyDown(area, { key: 'Enter' })
    expect(area.getAttribute('aria-pressed')).toBe('false')
    fireEvent.keyDown(area, { key: ' ' })
    expect(area.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(document.body)
    expect(area.getAttribute('aria-pressed')).toBe('false')
  })

  it('treats grouped province paths as one selected region', () => {
    const { getAllByTestId } = render(
      <IranMap
        mode='region'
        regions={[{ id: 'group', name: 'Group', provinces: ['tehran', 'fars'] }]}
        data={{ group: 70 }}
        colorBands={bands}
        selectedAreaColor='#123f4b'
      />,
    )
    const fragments = getAllByTestId('iran-map-region-group')
    fireEvent.click(fragments[0])
    expect(fragments.every((path) => path.getAttribute('aria-pressed') === 'true')).toBe(true)
    fireEvent.click(fragments[1])
    expect(fragments.every((path) => path.getAttribute('aria-pressed') === 'false')).toBe(true)
  })

  it('notifies the backward-compatible province callback when unselecting', () => {
    const selectProvinceHandler = vi.fn()
    const { getByTestId } = render(<IranMap data={data} selectProvinceHandler={selectProvinceHandler} />)
    const area = getByTestId('iran-map-province-tehran')
    fireEvent.click(area)
    fireEvent.click(area)
    expect(selectProvinceHandler).toHaveBeenLastCalledWith({ name: undefined, faName: undefined })
  })

  it('clears only the other map when interacting with multiple map instances', () => {
    const onDeselect = vi.fn()
    const { getAllByTestId } = render(
      <>
        <IranMap data={data} onDeselect={onDeselect} />
        <IranMap data={data} />
      </>,
    )
    const [first, second] = getAllByTestId('iran-map-province-tehran')
    fireEvent.click(first)
    fireEvent.click(second)
    expect(first.getAttribute('aria-pressed')).toBe('false')
    expect(second.getAttribute('aria-pressed')).toBe('true')
    expect(onDeselect).toHaveBeenCalledTimes(1)
  })

  it('removes its document handler when unmounted', () => {
    const onDeselect = vi.fn()
    const { getByTestId, unmount } = render(<IranMap data={data} onDeselect={onDeselect} />)
    fireEvent.click(getByTestId('iran-map-province-tehran'))
    unmount()
    fireEvent.click(document.body)
    expect(onDeselect).not.toHaveBeenCalled()
  })
})
