import { describe, expect, it, vi } from 'vitest'
import React from 'react'
import { render } from '@testing-library/react'
import { IranMap } from '@msameim181/iran-map-react'

vi.mock('react-tooltip', () => ({ Tooltip: () => null }))

describe('Map label outlines', () => {
  it('scales the province-label halo with focused text instead of using a thick fixed outline', () => {
    const { container } = render(<IranMap data={{ razaviKhorasan: 50 }} focusProvince='razaviKhorasan' />)
    const label = container.querySelector('.iran-map-label')!
    const width = Number(label.getAttribute('stroke-width'))
    expect(width).toBeGreaterThan(0)
    expect(width).toBeLessThan(1.25)
    expect(width / Number(label.getAttribute('font-size'))).toBeCloseTo(1.25 / 12)
  })
})
