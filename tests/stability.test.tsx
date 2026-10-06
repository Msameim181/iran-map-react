import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { act, fireEvent, render } from '@testing-library/react'
import { IranMap } from '@msameim181/iran-map-react'

const tooltipProps = vi.hoisted(() => ({ current: [] as Array<Record<string, unknown>> }))
const tooltipSpy = vi.hoisted(() => vi.fn())

vi.mock('react-tooltip', () => ({
  Tooltip: (props: Record<string, unknown>) => {
    tooltipProps.current.push(props)
    return null
  },
}))
// Every AreaPath render calls getAreaTooltip once, so its call count is the number of area renders.
vi.mock('@msameim181/iran-map-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@msameim181/iran-map-core')>()
  return {
    ...actual,
    getAreaTooltip: (...args: Parameters<typeof actual.getAreaTooltip>) => {
      tooltipSpy()
      return actual.getAreaTooltip(...args)
    },
  }
})

const data = { tehran: 60, fars: 80 }
const lastPosition = () => tooltipProps.current[tooltipProps.current.length - 1]?.position

beforeEach(() => {
  tooltipProps.current = []
  tooltipSpy.mockClear()
})

describe('render stability', () => {
  it('re-renders only the previous and the newly selected area when the selection changes', () => {
    const { getByTestId } = render(<IranMap data={data} />)
    tooltipSpy.mockClear()
    fireEvent.click(getByTestId('iran-map-province-tehran'))
    expect(tooltipSpy.mock.calls.length).toBeLessThanOrEqual(2)
    tooltipSpy.mockClear()
    fireEvent.click(getByTestId('iran-map-province-fars'))
    expect(tooltipSpy.mock.calls.length).toBeLessThanOrEqual(3) // old + new (+ a possible duplicate for strict compare)
    expect(tooltipSpy.mock.calls.length).toBeLessThan(31)
  })

  it('does not re-render areas when only a parent re-renders with new inline callbacks', () => {
    const { rerender } = render(<IranMap data={data} onHover={() => undefined} />)
    tooltipSpy.mockClear()
    rerender(<IranMap data={data} onHover={() => undefined} />)
    expect(tooltipSpy).not.toHaveBeenCalled()
  })
})

describe('keyboard tooltip pinning', () => {
  it('pins below the focused element, follows scroll and resize, and unpins on blur', () => {
    const { getByTestId } = render(<IranMap data={data} />)
    const area = getByTestId('iran-map-province-tehran')
    let rect = { left: 100, width: 40, bottom: 200 }
    area.getBoundingClientRect = () => rect as DOMRect
    area.matches = () => true // a keyboard focus (jsdom cannot evaluate :focus-visible)
    fireEvent.focus(area)
    expect(lastPosition()).toEqual({ x: 120, y: 208 })
    rect = { left: 100, width: 40, bottom: 120 }
    act(() => void window.dispatchEvent(new Event('scroll')))
    expect(lastPosition()).toEqual({ x: 120, y: 128 })
    rect = { left: 0, width: 20, bottom: 50 }
    act(() => void window.dispatchEvent(new Event('resize')))
    expect(lastPosition()).toEqual({ x: 10, y: 58 })
    fireEvent.blur(area)
    expect(lastPosition()).toBeUndefined()
  })

  it('still pins when the browser has no :focus-visible support', () => {
    const area = render(<IranMap data={data} />).getByTestId('iran-map-province-tehran')
    area.matches = () => {
      throw new SyntaxError("'not-a-pseudo' is not a valid selector")
    }
    fireEvent.focus(area)
    expect(lastPosition()).toBeDefined()
  })

  it('does not pin for pointer focus', () => {
    const area = render(<IranMap data={data} />).getByTestId('iran-map-province-tehran')
    area.matches = (selector: string) => selector !== ':focus-visible'
    fireEvent.focus(area)
    expect(lastPosition()).toBeUndefined()
  })
})

describe('tooltip id', () => {
  it('reduces a custom id to word characters so it cannot break a CSS selector', () => {
    const { container } = render(<IranMap data={data} tooltipId={`a'b ]c`} />)
    const id = container.querySelector('[data-area-type]')?.getAttribute('data-tooltip-id')
    expect(id).toBe('a-b--c')
    expect(tooltipProps.current[0].id).toBe(id)
  })
})
