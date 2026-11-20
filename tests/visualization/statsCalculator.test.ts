/**
 * statsCalculator.test.ts
 *
 * Tests for src/features/visualization/lib/statsCalculator.ts
 */
import { describe, it, expect } from 'vitest'
import {
  describeColumn,
  pearsonCorrelation,
  correlationMatrix,
  linearRegression,
  computeBoxPlot,
  histogramBins,
} from '../../src/features/visualization/lib/statsCalculator'
import type { ParsedDataset } from '../../src/features/cleaning/types'

// ── describeColumn ────────────────────────────────────────────────────────

describe('describeColumn', () => {
  const values = [2, 4, 4, 4, 5, 5, 7, 9]

  it('computes correct mean', () => {
    const stats = describeColumn(values)
    expect(stats.mean).toBeCloseTo(5, 5)
  })

  it('computes correct median', () => {
    const stats = describeColumn(values)
    // Sorted: 2,4,4,4,5,5,7,9 → median = (4+5)/2 = 4.5
    expect(stats.median).toBeCloseTo(4.5, 5)
  })

  it('computes correct min/max/range', () => {
    const stats = describeColumn(values)
    expect(stats.min).toBe(2)
    expect(stats.max).toBe(9)
    expect(stats.range).toBe(7)
  })

  it('computes correct variance (sample)', () => {
    const stats = describeColumn(values)
    // Known sample variance: 4.571...
    expect(stats.variance).toBeCloseTo(4.571, 2)
  })

  it('computes correct stddev', () => {
    const stats = describeColumn(values)
    expect(stats.stddev).toBeCloseTo(Math.sqrt(4.571), 2)
  })

  it('computes correct Q1 and Q3', () => {
    const stats = describeColumn(values)
    // Q1 at 25th percentile, Q3 at 75th percentile
    expect(stats.q1).toBeGreaterThanOrEqual(4)
    expect(stats.q3).toBeGreaterThanOrEqual(5)
    expect(stats.q3).toBeGreaterThan(stats.q1)
  })

  it('handles all-null column', () => {
    const stats = describeColumn([null, null, null])
    expect(stats.count).toBe(0)
    expect(stats.mean).toBe(0)
  })

  it('counts missing values', () => {
    const stats = describeColumn([1, null, 3, null, 5])
    expect(stats.missingCount).toBe(2)
    expect(stats.count).toBe(3)
  })

  it('computes mode', () => {
    const stats = describeColumn([1, 2, 2, 3, 3, 3])
    expect(stats.mode).toContain(3)
  })
})

// ── pearsonCorrelation ────────────────────────────────────────────────────

describe('pearsonCorrelation', () => {
  it('returns 1 for perfect positive correlation', () => {
    const x = [1, 2, 3, 4, 5]
    const r = pearsonCorrelation(x, x)
    expect(r).toBeCloseTo(1, 5)
  })

  it('returns -1 for perfect negative correlation', () => {
    const x = [1, 2, 3, 4, 5]
    const y = [5, 4, 3, 2, 1]
    const r = pearsonCorrelation(x, y)
    expect(r).toBeCloseTo(-1, 5)
  })

  it('returns null for constant column', () => {
    const r = pearsonCorrelation([1, 1, 1, 1], [1, 2, 3, 4])
    expect(r).toBeNull()
  })

  it('returns null for < 2 paired values', () => {
    const r = pearsonCorrelation([1], [2])
    expect(r).toBeNull()
  })

  it('computes a known correlation', () => {
    // Near-perfect positive: r should be > 0.99
    const x = [1, 2, 3, 4, 5]
    const y = [2.1, 3.9, 6.1, 7.9, 10.1]
    const r = pearsonCorrelation(x, y)
    expect(r).not.toBeNull()
    expect(r!).toBeGreaterThan(0.99)
  })
})

// ── correlationMatrix ─────────────────────────────────────────────────────

describe('correlationMatrix', () => {
  const ds: ParsedDataset = {
    fileName: 'test.csv',
    columns: ['x', 'y', 'z'],
    rows: [
      { x: 1, y: 2, z: 10 },
      { x: 2, y: 4, z: 20 },
      { x: 3, y: 6, z: 30 },
    ],
  }

  it('diagonal is 1', () => {
    const matrix = correlationMatrix(ds, ['x', 'y'])
    expect(matrix.values[0][0]).toBe(1)
    expect(matrix.values[1][1]).toBe(1)
  })

  it('is symmetric', () => {
    const matrix = correlationMatrix(ds, ['x', 'y'])
    expect(matrix.values[0][1]).toBeCloseTo(matrix.values[1][0] ?? 0, 5)
  })

  it('excludes constant column', () => {
    const dsConst: ParsedDataset = {
      fileName: 'test.csv',
      columns: ['x', 'const'],
      rows: [{ x: 1, const: 5 }, { x: 2, const: 5 }, { x: 3, const: 5 }],
    }
    const matrix = correlationMatrix(dsConst, ['x', 'const'])
    expect(matrix.excluded.some((e) => e.column === 'const')).toBe(true)
    expect(matrix.columns).not.toContain('const')
  })
})

// ── linearRegression ──────────────────────────────────────────────────────

describe('linearRegression', () => {
  it('computes correct slope and intercept for y = 2x + 1', () => {
    const x = [0, 1, 2, 3, 4]
    const y = x.map((v) => 2 * v + 1) // Perfect line
    const result = linearRegression(x, y)
    expect(result).not.toBeNull()
    expect(result!.slope).toBeCloseTo(2, 5)
    expect(result!.intercept).toBeCloseTo(1, 5)
    expect(result!.rSquared).toBeCloseTo(1, 5)
  })

  it('returns null for constant X', () => {
    const result = linearRegression([1, 1, 1], [1, 2, 3])
    expect(result).toBeNull()
  })

  it('returns null for < 2 data points', () => {
    const result = linearRegression([1], [2])
    expect(result).toBeNull()
  })

  it('computes R² correctly for approximate fit', () => {
    // y = 3x + noise
    const x = [1, 2, 3, 4, 5]
    const y = [3.1, 6.0, 9.2, 11.9, 15.1]
    const result = linearRegression(x, y)
    expect(result!.rSquared).toBeGreaterThan(0.99)
  })
})

// ── computeBoxPlot ────────────────────────────────────────────────────────

describe('computeBoxPlot', () => {
  it('computes correct quartiles', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const stats = computeBoxPlot(values)
    expect(stats.median).toBeCloseTo(5.5, 1)
    expect(stats.min).toBeGreaterThanOrEqual(1)
    expect(stats.max).toBeLessThanOrEqual(10)
  })

  it('identifies outliers', () => {
    const values = [1, 2, 3, 4, 5, 100] // 100 is a clear outlier
    const stats = computeBoxPlot(values)
    expect(stats.outliers).toContain(100)
  })

  it('handles empty array', () => {
    const stats = computeBoxPlot([])
    expect(stats.min).toBe(0)
    expect(stats.outliers).toHaveLength(0)
  })

  it('handles single value', () => {
    const stats = computeBoxPlot([42])
    expect(stats.median).toBe(42)
    expect(stats.outliers).toHaveLength(0)
  })
})

// ── histogramBins ─────────────────────────────────────────────────────────

describe('histogramBins', () => {
  it('creates correct number of bins', () => {
    const values = Array.from({ length: 100 }, (_, i) => i)
    const bins = histogramBins(values, 10)
    expect(bins.length).toBe(10)
  })

  it('total count equals input length', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const bins = histogramBins(values, 5)
    const total = bins.reduce((s, b) => s + b.count, 0)
    expect(total).toBe(10)
  })

  it('handles all-identical values as single bin', () => {
    const bins = histogramBins([5, 5, 5, 5], 10)
    expect(bins.length).toBe(1)
    expect(bins[0].count).toBe(4)
  })

  it('returns empty for empty input', () => {
    const bins = histogramBins([], 10)
    expect(bins).toHaveLength(0)
  })

  it('bin edges are correct', () => {
    const values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const bins = histogramBins(values, 2)
    expect(bins[0].start).toBe(0)
    expect(bins[bins.length - 1].end).toBe(9)
  })

  it('filters out null values', () => {
    const values = [1, null, 2, undefined, 3]
    const bins = histogramBins(values, 3)
    const total = bins.reduce((s, b) => s + b.count, 0)
    expect(total).toBe(3) // Only 1, 2, 3
  })
})
