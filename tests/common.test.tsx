import { describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import { fireEvent, render } from '@testing-library/react'
import { IranMap, countyBoundaries, provinceBoundaries } from '@msameim181/iran-map-react'

const provinceData = {
  ardabil: 0,
  isfahan: 20,
  alborz: 11,
  ilam: 18,
  eastAzerbaijan: 10,
  westAzerbaijan: 20,
  bushehr: 15,
  tehran: 55,
  chaharmahalandBakhtiari: 25,
  southKhorasan: 29,
  razaviKhorasan: 11,
  northKhorasan: 19,
  khuzestan: 12,
  zanjan: 18,
  semnan: 9,
  sistanAndBaluchestan: 3,
  fars: 7,
  qazvin: 35,
  qom: 30,
  kurdistan: 24,
  kerman: 23,
  kohgiluyehAndBoyerAhmad: 2,
  kermanshah: 7,
  golestan: 18,
  gilan: 14,
  lorestan: 7,
  mazandaran: 28,
  markazi: 25,
  hormozgan: 14,
  hamadan: 19,
  yazd: 32,
}

// Regression probes for land that was removed by clipping the county catalog
// against an unrelated province snapshot. Work in the map's WGS84 projection.
const pathContainsCoordinate = (path: string, longitude: number, latitude: number) => {
  const x = (longitude - 44) * 50
  const y = (40.5 - latitude) * 50
  let inside = false
  for (const subpath of path.match(/M[^Z]*Z/g) || []) {
    const ring = Array.from(subpath.matchAll(/[ML]([\d.-]+) ([\d.-]+)/g), (match) => [
      Number(match[1]),
      Number(match[2]),
    ])
    for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
      const [a, b] = ring[index]
      const [c, d] = ring[previous]
      if (b > y !== d > y && x < ((c - a) * (y - b)) / (d - b) + a) inside = !inside
    }
  }
  return inside
}

describe('IranMap', () => {
  it('renders the backward-compatible province map', () => {
    const { container } = render(<IranMap data={provinceData} colorRange='30, 70, 181' />)

    expect(container.querySelectorAll('[data-area-type="province"]')).toHaveLength(31)
  })

  it('renders the complete county map', () => {
    const { container, getByTestId } = render(<IranMap mode='county' data={{ 'razaviKhorasan.mashhad': 80 }} />)

    expect(container.querySelectorAll('[data-area-type="county"]')).toHaveLength(478)
    expect(getByTestId('iran-map-county-razaviKhorasan.mashhad')).toBeTruthy()
  })

  it('overlays selected counties on a province map', () => {
    const { container, getByTestId } = render(
      <IranMap data={{ ...provinceData, 'razaviKhorasan.mashhad': 90 }} detailedCounties={['mashhad']} />,
    )

    expect(container.querySelectorAll('[data-area-type="province"]')).toHaveLength(31)
    expect(container.querySelectorAll('[data-area-type="county"]')).toHaveLength(1)
    expect(getByTestId('iran-map-county-razaviKhorasan.mashhad')).toBeTruthy()
  })

  it('uses explicit threshold colors', () => {
    const { getByTestId } = render(
      <IranMap
        data={provinceData}
        colorBands={[
          { max: 50, color: '#facc15' },
          { min: 50, max: 70, color: '#ef4444' },
          { min: 70, max: 80, color: '#22c55e' },
          { min: 80, color: '#166534' },
        ]}
      />,
    )

    expect(getByTestId('iran-map-province-tehran').getAttribute('fill')).toBe('#ef4444')
  })

  it('groups provinces into an interactive region and supports county detail', () => {
    const onSelect = vi.fn()
    const { getAllByTestId, getByTestId } = render(
      <IranMap
        mode='region'
        regions={[
          {
            id: 'khorasan-region',
            name: 'Khorasan Region',
            faName: 'منطقه خراسان',
            provinces: ['razaviKhorasan', 'northKhorasan', 'southKhorasan'],
          },
        ]}
        data={{ 'khorasan-region': 72, 'razaviKhorasan.mashhad': 91 }}
        detailedCounties={['razaviKhorasan.mashhad']}
        onSelect={onSelect}
      />,
    )

    expect(getAllByTestId('iran-map-region-khorasan-region')).toHaveLength(3)
    expect(getByTestId('iran-map-county-razaviKhorasan.mashhad')).toBeTruthy()
    fireEvent.click(getAllByTestId('iran-map-region-khorasan-region')[0])
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'khorasan-region', type: 'region' }))
  })

  it('renders context-aware province and county capital markers', () => {
    const provinceView = render(<IranMap data={provinceData} capitalMarkers='auto' />)
    expect(provinceView.container.querySelectorAll('[data-capital-type="province"]')).toHaveLength(31)
    expect(provinceView.getByTestId('iran-map-capital-province-razaviKhorasan').getAttribute('data-latitude')).toBe(
      '36.29807',
    )
    provinceView.unmount()

    const countyView = render(<IranMap mode='county' data={{}} capitalMarkers='auto' />)
    expect(countyView.container.querySelectorAll('[data-capital-type="county"]')).toHaveLength(484)
  })

  it('reports the selected capital with its geographic coordinates', () => {
    const onCapitalSelect = vi.fn()
    const { getByTestId } = render(
      <IranMap data={provinceData} capitalMarkers='province' onCapitalSelect={onCapitalSelect} />,
    )

    fireEvent.click(getByTestId('iran-map-capital-province-razaviKhorasan'))
    expect(onCapitalSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        areaId: 'razaviKhorasan',
        faName: 'مشهد',
        latitude: 36.29807,
        longitude: 59.60567,
      }),
    )
  })

  it('renders the surrounding waters and physical Iranian island coastlines', () => {
    const { container, getByTestId } = render(<IranMap data={provinceData} />)

    expect(container.querySelectorAll('[data-water-id]')).toHaveLength(4)
    expect(container.querySelectorAll('[data-island-id]')).toHaveLength(17)
    expect(getByTestId('iran-map-island-qeshm').getAttribute('data-province-id')).toBe('hormozgan')
    expect(getByTestId('iran-map-island-farsi').getAttribute('data-latitude')).toBe('27.993096')
  })

  it('selects an island through its active province or county layer', () => {
    const onSelect = vi.fn()
    const onIslandSelect = vi.fn()
    const { getByTestId } = render(<IranMap data={provinceData} onSelect={onSelect} onIslandSelect={onIslandSelect} />)

    fireEvent.click(getByTestId('iran-map-island-qeshm'))
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'hormozgan', type: 'province' }))
    expect(onIslandSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'qeshm', countyId: 'hormozgan.qeshm' }),
      expect.objectContaining({ id: 'hormozgan' }),
    )
  })

  it('does not render the former Bushehr maritime envelope as a detached dot', () => {
    const bushehr = provinceBoundaries.find((province) => province.id === 'bushehr')

    expect(bushehr?.path.match(/M[^Z]+Z/g)).toHaveLength(1)
  })

  it('focuses the viewport on one province with only its selected counties', () => {
    const { container, getByTestId, queryByTestId } = render(
      <IranMap
        data={{ ...provinceData, 'razaviKhorasan.mashhad': 90, 'razaviKhorasan.neyshabur': 65 }}
        focusProvince='razaviKhorasan'
        detailedCounties={['mashhad', 'neyshabur']}
        capitalMarkers='auto'
      />,
    )

    expect(container.querySelectorAll('[data-area-type="province"]')).toHaveLength(1)
    expect(container.querySelectorAll('[data-area-type="county"]')).toHaveLength(2)
    expect(getByTestId('iran-map-county-razaviKhorasan.mashhad')).toBeTruthy()
    expect(queryByTestId('iran-map-county-tehran.tehran')).toBeNull()
    expect(container.querySelector('svg')?.getAttribute('viewBox')).not.toBe('0 0 1000 825')
    expect(container.querySelectorAll('[data-capital-type="province"]')).toHaveLength(1)
  })

  it('keeps island land separate while linking it to its county color and selection', () => {
    const onSelect = vi.fn()
    const qeshmBoundary = countyBoundaries.find((county) => county.id === 'hormozgan.qeshm')
    const { getByTestId } = render(
      <IranMap mode='county' focusProvince='hormozgan' data={{ 'hormozgan.qeshm': 72 }} onSelect={onSelect} />,
    )

    expect(qeshmBoundary?.path).toBe('')
    fireEvent.click(getByTestId('iran-map-island-qeshm'))
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'hormozgan.qeshm', type: 'county', value: 72 }))
  })

  it('retains high-detail province and Shahrestan geometry', () => {
    const countVertices = (path: string) => path.match(/[ML][\d.-]+ [\d.-]+/g)?.length || 0
    const provinceVertices = provinceBoundaries.reduce((total, boundary) => total + countVertices(boundary.path), 0)
    const countyVertices = countyBoundaries.reduce((total, boundary) => total + countVertices(boundary.path), 0)

    expect(provinceVertices).toBeGreaterThan(50_000)
    expect(countyVertices).toBeGreaterThan(150_000)
  })

  it.each([
    ['hormozgan.minab', 57.55, 27],
    ['hormozgan.minab', 57.8, 26.9],
    ['hormozgan.bashagard', 58.3, 26.5],
  ])('preserves county coverage in %s at %s E, %s N', (id, longitude, latitude) => {
    const county = countyBoundaries.find((boundary) => boundary.id === id)!
    const province = provinceBoundaries.find((boundary) => boundary.id === 'hormozgan')!
    const kerman = provinceBoundaries.find((boundary) => boundary.id === 'kerman')!

    expect(pathContainsCoordinate(county.path, longitude, latitude)).toBe(true)
    expect(pathContainsCoordinate(province.path, longitude, latitude)).toBe(true)
    expect(pathContainsCoordinate(kerman.path, longitude, latitude)).toBe(false)
  })

  it.each([
    [56.43, 27.09],
    [53.98, 26.53],
  ])('keeps open water clear of mainland county polygons at %s E, %s N', (longitude, latitude) => {
    expect(countyBoundaries.some((boundary) => pathContainsCoordinate(boundary.path, longitude, latitude))).toBe(false)
  })
})
