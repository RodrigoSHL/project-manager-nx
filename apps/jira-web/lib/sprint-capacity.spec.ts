import { getSprintCapacity } from './sprint-capacity'

describe('getSprintCapacity', () => {
  it.each([
    ['2026-11-02', '2026-11-13', 10, 42],
    ['2026-11-01', '2026-11-30', 21, 88],
    ['2026-11-13T00:00:00.000Z', '2026-11-16', 2, 8],
    ['2026-11-14', '2026-11-15', 0, 0],
  ])('counts weekdays inclusively from %s to %s', (start, end, weekdays, points) => {
    expect(getSprintCapacity(start, end, 21)).toEqual({ weekdays, points })
  })

  it('leaves capacity unknown without valid dates and a weekly target', () => {
    expect(getSprintCapacity(null, '2026-11-30', 21)).toEqual({ weekdays: null, points: null })
    expect(getSprintCapacity('2026-11-30', '2026-11-01', 21)).toEqual({ weekdays: null, points: null })
    expect(getSprintCapacity('2026-11-02', '2026-11-06')).toEqual({ weekdays: 5, points: null })
  })
})
