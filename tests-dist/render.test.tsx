import { afterEach, describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { act as testUtilsAct } from 'react-dom/test-utils'
import { IranMap, ScoreBands } from '@msameim181/iran-map-react'
import { IranMap as FullMap } from '@msameim181/iran-map-react/full'

// Runs against the BUILT dist (see vitest.dist.config.ts) with the real react-tooltip, on whichever React version is
// installed (16.14 - 19), so it uses no testing-library and only APIs that exist in every supported React.
const act: (callback: () => void) => void = (React as unknown as { act?: typeof testUtilsAct }).act ?? testUtilsAct
const globals = globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }
globals.IS_REACT_ACT_ENVIRONMENT = true

interface Root {
  render: (element: React.ReactElement) => void
  unmount: () => void
}

// `react-dom/client` only exists in React 18+, and importing createRoot from `react-dom` warns there.
const clientModule = 'react-dom/client'
const client: { createRoot?: (el: HTMLElement) => Root } | undefined = await import(
  /* @vite-ignore */ clientModule
).catch(() => undefined)

/* eslint-disable react/no-deprecated -- ReactDOM.render is the only API on React 16 and 17 */
const createRoot = (container: HTMLElement): Root => {
  if (client?.createRoot) return client.createRoot(container)
  return {
    render: (element) => void ReactDOM.render(element, container),
    unmount: () => void ReactDOM.unmountComponentAtNode(container),
  }
}

/* eslint-enable react/no-deprecated */

const mounted: Array<{ root: Root; container: HTMLElement }> = []
const mount = (element: React.ReactElement) => {
  const container = document.body.appendChild(document.createElement('div'))
  const root = createRoot(container)
  act(() => root.render(element))
  mounted.push({ root, container })
  return container
}
const click = (element: Element) => act(() => void element.dispatchEvent(new MouseEvent('click', { bubbles: true })))
const key = (element: Element, type: 'keydown' | 'keyup', value: string) =>
  act(() => void element.dispatchEvent(new KeyboardEvent(type, { key: value, bubbles: true, cancelable: true })))

afterEach(() => {
  mounted.splice(0).forEach(({ root, container }) => {
    act(() => root.unmount())
    container.remove()
  })
})

describe('built package on this React version', () => {
  it('renders, selects, toggles from the keyboard and cleans up', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const onSelect = vi.fn()
    const onDeselect = vi.fn()
    const container = mount(<IranMap data={{ tehran: 40 }} onSelect={onSelect} onDeselect={onDeselect} />)

    expect(container.querySelectorAll('[data-area-type="province"]')).toHaveLength(31)
    expect(container.querySelector('svg')?.getAttribute('role')).toBe('group')
    const tehran = container.querySelector('[data-area-id="tehran"]') as Element
    click(tehran)
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'tehran', value: 40 }))
    expect(tehran.getAttribute('aria-pressed')).toBe('true')
    key(tehran, 'keydown', 'Enter')
    expect(onDeselect).toHaveBeenCalledTimes(1)
    key(tehran, 'keydown', ' ')
    key(tehran, 'keyup', ' ')
    expect(tehran.getAttribute('aria-pressed')).toBe('true')
    expect(errors).not.toHaveBeenCalled()
    errors.mockRestore()
  })

  it('renders the full map with islands and the real tooltip anchors', () => {
    const container = mount(<FullMap mode='county' data={{}} tooltipId='dist-tip' />)
    expect(container.querySelectorAll('[data-area-type="county"]').length).toBeGreaterThan(400)
    expect(container.querySelectorAll('[data-island-id]')).toHaveLength(17)
    expect(container.querySelector('[data-tooltip-id="dist-tip"]')).toBeTruthy()
  })

  it('renders ScoreBands', () => {
    const container = mount(<ScoreBands bands={[{ max: 50, color: '#f00' }]} />)
    expect(container.querySelector('.iran-score-bands')).toBeTruthy()
  })
})
