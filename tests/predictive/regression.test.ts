/**
 * regression.test.ts
 *
 * Tests for src/features/predictive/lib/regression.ts
 * Verifies mathematical correctness, error handling, and edge cases.
 */
import { describe, it, expect } from 'vitest'
import { runLinearRegression, predictY, prepareRegressionData } from '../../src/features/predictive/lib/regression'
import type { ParsedDataset } from '../../src/features/cleaning/types'

function makeDataset(columns: string[], rows: Record<string, unknown>[]): ParsedDataset {
  return { fileName: 'test.csv', columns, rows: rows as ParsedDataset['rows'] }
}

// ── prepareRegressionData ─────────────────────────────────────────────────

describe('prepareRegressionData', () => {
  it('returns an error when xCol and yCol are the same', () => {
    const ds = makeDataset(['x', 'y'], [{ x: 1, y: 2 }])
    const result = prepareRegressionData({ dataset: ds, xCol: 'x', yCol: 'x' })
    expect('error' in result).toBe(true)
    if ('error' in result) expect(result.error.kind).toBe('same_column')
  })

  it('returns an error for a missing column', () => {
    const ds = makeDataset(['x'], [{ x: 1 }])
    const result = prepareRegressionData({ dataset: ds, xCol: 'x', yCol: 'z' })
    expect('error' in result).toBe(true)
    if ('error' in result) expect(result.error.kind).toBe('missing_column')
  })

  it('excludes rows with null x values', () => {
    const ds = makeDataset(['x', 'y'], [
      { x: 1, y: 2 },
      { x: null, y: 3 },
      { x: 2, y: 4 },
    ])
    const result = prepareRegressionData({ dataset: ds, xCol: 'x', yCol: 'y' })
    expect('validRows' in result).toBe(true)
    if ('validRows' in result) {
      expect(result.validRows.length).toBe(2)
      expect(result.excludedCount).toBe(1)
    }
  })

  it('excludes rows with non-numeric x values', () => {
    const ds = makeDataset(['x', 'y'], [
      { x: 'hello', y: 2 },
      { x: 3, y: 4 },
      { x: 5, y: 6 },
    ])
    const result = prepareRegressionData({ dataset: ds, xCol: 'x', yCol: 'y' })
    if ('validRows' in result) {
      expect(result.validRows.length).toBe(2)
      expect(result.excludedCount).toBe(1)
    }
  })
})

// ── runLinearRegression ───────────────────────────────────────────────────

describe('runLinearRegression - known result', () => {
  // y = 2x + 1  with x ∈ {1,2,3,4,5}
  const ds = makeDataset(['x', 'y'], [
    { x: 1, y: 3 },
    { x: 2, y: 5 },
    { x: 3, y: 7 },
    { x: 4, y: 9 },
    { x: 5, y: 11 },
  ])

  it('computes correct slope and intercept', () => {
    const result = runLinearRegression({ dataset: ds, xCol: 'x', yCol: 'y' })
    expect('slope' in result).toBe(true)
    if ('slope' in result) {
      expect(result.slope).toBeCloseTo(2, 5)
      expect(result.intercept).toBeCloseTo(1, 5)
    }
  })

  it('computes R² = 1 for perfect linear data', () => {
    const result = runLinearRegression({ dataset: ds, xCol: 'x', yCol: 'y' })
    if ('rSquared' in result) {
      expect(result.rSquared).toBeCloseTo(1, 5)
    }
  })

  it('formats the equation correctly', () => {
    const result = runLinearRegression({ dataset: ds, xCol: 'x', yCol: 'y' })
    if ('equation' in result) {
      expect(result.equation).toMatch(/ŷ = 2\.0000x \+ 1\.0000/)
    }
  })
})

describe('runLinearRegression - negative intercept formatting', () => {
  // y = 3x - 2
  const ds = makeDataset(['x', 'y'], [
    { x: 1, y: 1 },
    { x: 2, y: 4 },
    { x: 3, y: 7 },
    { x: 4, y: 10 },
    { x: 5, y: 13 },
  ])

  it('shows minus sign for negative intercept', () => {
    const result = runLinearRegression({ dataset: ds, xCol: 'x', yCol: 'y' })
    if ('equation' in result) {
      expect(result.equation).toMatch(/ŷ = 3\.0000x - 2\.0000/)
    }
  })
})

describe('runLinearRegression - error cases', () => {
  it('returns insufficient_data when fewer than 3 valid rows', () => {
    const ds = makeDataset(['x', 'y'], [
      { x: 1, y: 2 },
      { x: 2, y: 4 },
    ])
    const result = runLinearRegression({ dataset: ds, xCol: 'x', yCol: 'y' })
    expect('kind' in result).toBe(true)
    if ('kind' in result) expect(result.kind).toBe('insufficient_data')
  })

  it('returns constant_x when all X values are identical', () => {
    const ds = makeDataset(['x', 'y'], [
      { x: 5, y: 1 },
      { x: 5, y: 2 },
      { x: 5, y: 3 },
      { x: 5, y: 4 },
    ])
    const result = runLinearRegression({ dataset: ds, xCol: 'x', yCol: 'y' })
    expect('kind' in result).toBe(true)
    if ('kind' in result) expect(result.kind).toBe('constant_x')
  })

  it('returns same_column error when x === y column', () => {
    const ds = makeDataset(['x', 'y'], [{ x: 1, y: 2 }])
    const result = runLinearRegression({ dataset: ds, xCol: 'x', yCol: 'x' })
    expect('kind' in result).toBe(true)
    if ('kind' in result) expect(result.kind).toBe('same_column')
  })
})

describe('runLinearRegression - constant Y', () => {
  it('returns slope=0 and rSquared=null when all Y values are identical', () => {
    const ds = makeDataset(['x', 'y'], [
      { x: 1, y: 7 },
      { x: 2, y: 7 },
      { x: 3, y: 7 },
      { x: 4, y: 7 },
    ])
    const result = runLinearRegression({ dataset: ds, xCol: 'x', yCol: 'y' })
    expect('slope' in result).toBe(true)
    if ('slope' in result) {
      expect(result.slope).toBe(0)
      expect(result.intercept).toBe(7)
      expect(result.rSquared).toBeNull()
    }
  })
})

describe('runLinearRegression - excludes invalid rows', () => {
  it('skips rows with missing values without crashing', () => {
    const ds = makeDataset(['x', 'y'], [
      { x: 1, y: 3 },
      { x: null, y: 5 },
      { x: 2, y: 5 },
      { x: 'N/A', y: 7 },
      { x: 3, y: 7 },
    ])
    const result = runLinearRegression({ dataset: ds, xCol: 'x', yCol: 'y' })
    expect('slope' in result).toBe(true)
    if ('slope' in result) {
      expect(result.validRows.length).toBe(3)
      expect(result.excludedCount).toBe(2)
    }
  })
})

// ── predictY ──────────────────────────────────────────────────────────────

describe('predictY', () => {
  it('computes y = slope * x + intercept', () => {
    expect(predictY(2, 1, 5)).toBe(11)
    expect(predictY(0.5, 10, 4)).toBe(12)
    expect(predictY(-1, 100, 10)).toBe(90)
  })
})
