/**
 * forecasting.test.ts
 *
 * Tests for src/features/predictive/lib/forecasting.ts
 * Verifies mathematical correctness, interval detection, duplicate handling,
 * irregular date handling, and forecast horizon warnings.
 */
import { describe, it, expect } from 'vitest'
import { runForecast } from '../../src/features/predictive/lib/forecasting'
import type { ParsedDataset } from '../../src/features/cleaning/types'

function makeDataset(columns: string[], rows: Record<string, unknown>[]): ParsedDataset {
  return { fileName: 'test.csv', columns, rows: rows as ParsedDataset['rows'] }
}

// ── Error cases ───────────────────────────────────────────────────────────

describe('runForecast - error cases', () => {
  it('returns missing_column error for unknown dateCol', () => {
    const ds = makeDataset(['date', 'value'], [{ date: '2024-01-01', value: 10 }])
    const result = runForecast({ dataset: ds, dateCol: 'missing', valueCol: 'value', periods: 3 })
    expect('kind' in result).toBe(true)
    if ('kind' in result) expect(result.kind).toBe('missing_column')
  })

  it('returns missing_column error for unknown valueCol', () => {
    const ds = makeDataset(['date', 'value'], [{ date: '2024-01-01', value: 10 }])
    const result = runForecast({ dataset: ds, dateCol: 'date', valueCol: 'missing', periods: 3 })
    expect('kind' in result).toBe(true)
    if ('kind' in result) expect(result.kind).toBe('missing_column')
  })

  it('returns invalid_periods for periods < 1', () => {
    const ds = makeDataset(['date', 'value'], [{ date: '2024-01-01', value: 10 }])
    const result = runForecast({ dataset: ds, dateCol: 'date', valueCol: 'value', periods: 0 })
    expect('kind' in result).toBe(true)
    if ('kind' in result) expect(result.kind).toBe('invalid_periods')
  })

  it('returns invalid_periods for periods > 30', () => {
    const ds = makeDataset(['date', 'value'], [{ date: '2024-01-01', value: 10 }])
    const result = runForecast({ dataset: ds, dateCol: 'date', valueCol: 'value', periods: 31 })
    expect('kind' in result).toBe(true)
    if ('kind' in result) expect(result.kind).toBe('invalid_periods')
  })

  it('returns insufficient_data when fewer than 3 valid rows', () => {
    const ds = makeDataset(['date', 'value'], [
      { date: '2024-01-01', value: 10 },
      { date: '2024-01-02', value: 20 },
    ])
    const result = runForecast({ dataset: ds, dateCol: 'date', valueCol: 'value', periods: 3 })
    expect('kind' in result).toBe(true)
    if ('kind' in result) expect(result.kind).toBe('insufficient_data')
  })

  it('excludes rows with invalid dates', () => {
    const ds = makeDataset(['date', 'value'], [
      { date: '2024-01-01', value: 10 },
      { date: 'not-a-date', value: 20 },
      { date: '2024-01-03', value: 30 },
    ])
    // Only 2 valid rows — should return insufficient_data
    const result = runForecast({ dataset: ds, dateCol: 'date', valueCol: 'value', periods: 2 })
    expect('kind' in result).toBe(true)
    if ('kind' in result) expect(result.kind).toBe('insufficient_data')
  })

  it('excludes rows with non-numeric values', () => {
    const ds = makeDataset(['date', 'value'], [
      { date: '2024-01-01', value: 'N/A' },
      { date: '2024-01-02', value: 20 },
      { date: '2024-01-03', value: 30 },
    ])
    // Only 2 valid rows
    const result = runForecast({ dataset: ds, dateCol: 'date', valueCol: 'value', periods: 2 })
    expect('kind' in result).toBe(true)
    if ('kind' in result) expect(result.kind).toBe('insufficient_data')
  })
})

// ── Daily interval — known linear trend ───────────────────────────────────

describe('runForecast - daily interval, perfect linear trend', () => {
  // value = 10 * day_index → slope=10, intercept=0
  const rows = [
    { date: '2024-01-01', value: 10 },
    { date: '2024-01-02', value: 20 },
    { date: '2024-01-03', value: 30 },
    { date: '2024-01-04', value: 40 },
    { date: '2024-01-05', value: 50 },
  ]
  const ds = makeDataset(['date', 'value'], rows)

  it('returns correct number of historical and forecast points', () => {
    const result = runForecast({ dataset: ds, dateCol: 'date', valueCol: 'value', periods: 3 })
    expect('historical' in result).toBe(true)
    if ('historical' in result) {
      expect(result.historical.length).toBe(5)
      expect(result.forecast.length).toBe(3)
    }
  })

  it('detects daily interval', () => {
    const result = runForecast({ dataset: ds, dateCol: 'date', valueCol: 'value', periods: 3 })
    if ('intervalLabel' in result) {
      expect(result.intervalLabel).toBe('daily')
    }
  })

  it('forecasts the next day as a date string (not "Step N")', () => {
    const result = runForecast({ dataset: ds, dateCol: 'date', valueCol: 'value', periods: 1 })
    if ('forecast' in result) {
      expect(result.forecast[0].label).toBe('2024-01-06')
    }
  })

  it('forecast values follow the linear trend', () => {
    const result = runForecast({ dataset: ds, dateCol: 'date', valueCol: 'value', periods: 2 })
    if ('forecast' in result) {
      // Perfect linear data: slope=10, intercept=0
      // index 5 → 60, index 6 → 70
      expect(result.forecast[0].value).toBeCloseTo(60, 2)
      expect(result.forecast[1].value).toBeCloseTo(70, 2)
    }
  })

  it('marks all forecast points with isForecast=true', () => {
    const result = runForecast({ dataset: ds, dateCol: 'date', valueCol: 'value', periods: 3 })
    if ('forecast' in result) {
      expect(result.forecast.every((p) => p.isForecast === true)).toBe(true)
    }
  })

  it('marks all historical points with isForecast=false', () => {
    const result = runForecast({ dataset: ds, dateCol: 'date', valueCol: 'value', periods: 3 })
    if ('historical' in result) {
      expect(result.historical.every((p) => p.isForecast === false)).toBe(true)
    }
  })
})

// ── Monthly interval ──────────────────────────────────────────────────────

describe('runForecast - monthly interval', () => {
  const rows = [
    { date: '2024-01-01', value: 100 },
    { date: '2024-02-01', value: 110 },
    { date: '2024-03-01', value: 120 },
    { date: '2024-04-01', value: 130 },
  ]
  const ds = makeDataset(['date', 'value'], rows)

  it('detects monthly interval', () => {
    const result = runForecast({ dataset: ds, dateCol: 'date', valueCol: 'value', periods: 2 })
    if ('intervalLabel' in result) {
      expect(result.intervalLabel).toBe('monthly')
    }
  })

  it('forecasts the next months correctly', () => {
    const result = runForecast({ dataset: ds, dateCol: 'date', valueCol: 'value', periods: 2 })
    if ('forecast' in result) {
      expect(result.forecast[0].label).toBe('2024-05-01')
      expect(result.forecast[1].label).toBe('2024-06-01')
    }
  })
})

// ── Duplicate timestamps ──────────────────────────────────────────────────

describe('runForecast - duplicate timestamps', () => {
  it('averages duplicate timestamps and sets duplicatesAveraged flag', () => {
    const rows = [
      { date: '2024-01-01', value: 10 },
      { date: '2024-01-01', value: 20 },   // duplicate — should average to 15
      { date: '2024-01-02', value: 30 },
      { date: '2024-01-03', value: 40 },
    ]
    const ds = makeDataset(['date', 'value'], rows)
    const result = runForecast({ dataset: ds, dateCol: 'date', valueCol: 'value', periods: 1 })
    expect('duplicatesAveraged' in result).toBe(true)
    if ('duplicatesAveraged' in result) {
      expect(result.duplicatesAveraged).toBe(true)
      // Deduplicated: 3 points (2024-01-01 avg=15, 2024-01-02=30, 2024-01-03=40)
      expect(result.historical.length).toBe(3)
      expect(result.historical[0].value).toBeCloseTo(15, 5)
    }
  })

  it('includes a warning message about duplicate timestamps', () => {
    const rows = [
      { date: '2024-01-01', value: 10 },
      { date: '2024-01-01', value: 20 },
      { date: '2024-01-02', value: 30 },
      { date: '2024-01-03', value: 40 },
    ]
    const ds = makeDataset(['date', 'value'], rows)
    const result = runForecast({ dataset: ds, dateCol: 'date', valueCol: 'value', periods: 1 })
    if ('warnings' in result) {
      expect(result.warnings.some((w) => w.toLowerCase().includes('duplicate'))).toBe(true)
    }
  })
})

// ── Irregular dates — observation order fallback ───────────────────────────

describe('runForecast - irregular interval', () => {
  it('uses "Step N" labels when interval cannot be determined', () => {
    const rows = [
      { date: '2024-01-01', value: 10 },
      { date: '2024-01-07', value: 20 },   // 6 days
      { date: '2024-01-10', value: 30 },   // 3 days — mixed
      { date: '2024-01-20', value: 40 },   // 10 days
    ]
    const ds = makeDataset(['date', 'value'], rows)
    const result = runForecast({ dataset: ds, dateCol: 'date', valueCol: 'value', periods: 2 })
    if ('forecast' in result) {
      expect(result.forecast[0].label).toMatch(/^Step \d+$/)
      expect(result.forecast[1].label).toMatch(/^Step \d+$/)
    }
  })

  it('sets intervalLabel to "observation order" for irregular data', () => {
    const rows = [
      { date: '2024-01-01', value: 10 },
      { date: '2024-01-07', value: 20 },
      { date: '2024-01-10', value: 30 },
      { date: '2024-01-20', value: 40 },
    ]
    const ds = makeDataset(['date', 'value'], rows)
    const result = runForecast({ dataset: ds, dateCol: 'date', valueCol: 'value', periods: 1 })
    if ('intervalLabel' in result) {
      expect(result.intervalLabel).toBe('observation order')
    }
  })
})

// ── Forecast horizon warning ───────────────────────────────────────────────

describe('runForecast - forecast horizon warning', () => {
  it('warns when periods > number of observations', () => {
    const rows = [
      { date: '2024-01-01', value: 10 },
      { date: '2024-01-02', value: 20 },
      { date: '2024-01-03', value: 30 },
    ]
    const ds = makeDataset(['date', 'value'], rows)
    const result = runForecast({ dataset: ds, dateCol: 'date', valueCol: 'value', periods: 10 })
    if ('warnings' in result) {
      expect(result.warnings.some((w) => w.includes('exceed'))).toBe(true)
    }
  })

  it('does not warn when periods <= number of observations', () => {
    const rows = [
      { date: '2024-01-01', value: 10 },
      { date: '2024-01-02', value: 20 },
      { date: '2024-01-03', value: 30 },
      { date: '2024-01-04', value: 40 },
      { date: '2024-01-05', value: 50 },
    ]
    const ds = makeDataset(['date', 'value'], rows)
    const result = runForecast({ dataset: ds, dateCol: 'date', valueCol: 'value', periods: 3 })
    if ('warnings' in result) {
      expect(result.warnings.every((w) => !w.includes('exceed'))).toBe(true)
    }
  })
})

// ── Historical values are preserved ───────────────────────────────────────

describe('runForecast - historical values are unmodified (no missing)', () => {
  it('historical values match input values exactly', () => {
    const rows = [
      { date: '2024-03-01', value: 100 },
      { date: '2024-03-02', value: 150 },
      { date: '2024-03-03', value: 200 },
      { date: '2024-03-04', value: 250 },
    ]
    const ds = makeDataset(['date', 'value'], rows)
    const result = runForecast({ dataset: ds, dateCol: 'date', valueCol: 'value', periods: 1 })
    if ('historical' in result) {
      const values = result.historical.map((p) => p.value)
      expect(values).toEqual([100, 150, 200, 250])
    }
  })
})

// ── Rows with excluded values ──────────────────────────────────────────────

describe('runForecast - excludedCount', () => {
  it('counts excluded rows correctly', () => {
    const rows = [
      { date: '2024-01-01', value: 10 },
      { date: '2024-01-02', value: null },   // excluded
      { date: 'bad', value: 30 },            // excluded
      { date: '2024-01-03', value: 40 },
      { date: '2024-01-04', value: 50 },
    ]
    const ds = makeDataset(['date', 'value'], rows)
    const result = runForecast({ dataset: ds, dateCol: 'date', valueCol: 'value', periods: 2 })
    if ('excludedCount' in result) {
      expect(result.excludedCount).toBe(2)
    }
  })
})
