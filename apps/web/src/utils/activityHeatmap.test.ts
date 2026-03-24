import { describe, expect, it } from 'vitest'

import {
  HEATMAP_CELL_GAP,
  HEATMAP_CELL_SIZE,
  buildHeatmapCells,
  getHeatmapWeekCount,
  getMonthMarkers,
} from './activityHeatmap'

describe('activityHeatmap utilities', () => {
  it('returns more than 26 weeks for a wide desktop column without changing cell metrics', () => {
    expect(getHeatmapWeekCount(760)).toBeGreaterThan(26)
    expect(getHeatmapWeekCount(200)).toBe(26)
    expect(HEATMAP_CELL_SIZE).toBe(11)
    expect(HEATMAP_CELL_GAP).toBe(3)
  })

  it('builds a week-major grid with a fixed cell count and zeroed future cells', () => {
    const today = new Date(2026, 2, 18, 12)
    const cells = buildHeatmapCells(
      [
        { date: new Date(2026, 2, 18, 9), words: 120 },
        { date: new Date(2026, 2, 19, 9), words: 999 },
      ],
      4,
      today
    )

    expect(cells).toHaveLength(28)
    expect(cells.filter((cell) => cell.isFuture)).toHaveLength(3)
    expect(cells.filter((cell) => cell.isFuture).every((cell) => cell.words === 0)).toBe(true)

    const todayCell = cells.find(
      (cell) =>
        cell.date.getFullYear() === 2026 &&
        cell.date.getMonth() === 2 &&
        cell.date.getDate() === 18
    )

    expect(todayCell?.words).toBe(120)
  })

  it('spaces nearby month labels apart when months turn over inside the same week', () => {
    const start = new Date(2025, 8, 28)
    const cells = Array.from({ length: 56 }, (_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)

      return {
        date,
        words: 0,
        isFuture: false,
      }
    })

    const markers = getMonthMarkers(cells, 28)

    expect(markers.slice(0, 2).map((marker) => marker.label)).toEqual(['Sep', 'Oct'])
    expect(markers[0]).toBeDefined()
    expect(markers[1]).toBeDefined()
    expect(markers[1]!.left - markers[0]!.left).toBeGreaterThanOrEqual(28)
  })
})
