/**
 * statsCalculator.ts
 *
 * Pure statistical functions for the visualization feature.
 * No side effects — all functions are deterministic given the same inputs.
 */
import type { ParsedDataset, DescriptiveStats, BoxPlotStats, HistogramBin, CorrelationMatrix } from '../types'

// ── Helpers ───────────────────────────────────────────────────────────────

type Numeric = number | string | null | undefined

function sortedNumerics(values: Numeric[]): number[] {
  return values
    .filter((v) => v !== null && v !== undefined && String(v).trim() !== '' && isFinite(Number(v)))
    .map(Number)
    .sort((a, b) => a - b)
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

// ── Descriptive statistics ────────────────────────────────────────────────

export function describeColumn(
  rawValues: Numeric[],
): DescriptiveStats {
  const all = rawValues.filter((v) => v !== null && v !== undefined && String(v).trim() !== '')
  const missingCount = rawValues.length - all.length
  const numerics = sortedNumerics(rawValues)
  const count = numerics.length

  if (count === 0) {
    return {
      count: 0, missingCount, mean: 0, median: 0, mode: [], min: 0, max: 0,
      range: 0, variance: 0, stddev: 0, q1: 0, q3: 0, iqr: 0,
      p5: 0, p25: 0, p75: 0, p95: 0,
    }
  }

  const sum = numerics.reduce((s, v) => s + v, 0)
  const mean = sum / count
  const median = percentile(numerics, 50)
  const q1 = percentile(numerics, 25)
  const q3 = percentile(numerics, 75)

  // Mode: most frequent value(s)
  const freq = new Map<number, number>()
  for (const v of numerics) {
    freq.set(v, (freq.get(v) ?? 0) + 1)
  }
  const maxFreq = Math.max(...freq.values())
  const mode = [...freq.entries()].filter(([, f]) => f === maxFreq).map(([v]) => v)

  const variance = count < 2
    ? 0
    : numerics.reduce((s, v) => s + (v - mean) ** 2, 0) / (count - 1)

  return {
    count,
    missingCount,
    mean,
    median,
    mode,
    min: numerics[0],
    max: numerics[numerics.length - 1],
    range: numerics[numerics.length - 1] - numerics[0],
    variance,
    stddev: Math.sqrt(variance),
    q1,
    q3,
    iqr: q3 - q1,
    p5: percentile(numerics, 5),
    p25: q1,
    p75: q3,
    p95: percentile(numerics, 95),
  }
}

// ── Pearson correlation ───────────────────────────────────────────────────

export function pearsonCorrelation(x: number[], y: number[]): number | null {
  if (x.length !== y.length || x.length < 2) return null

  const n = x.length
  const meanX = x.reduce((s, v) => s + v, 0) / n
  const meanY = y.reduce((s, v) => s + v, 0) / n

  let cov = 0
  let varX = 0
  let varY = 0
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX
    const dy = y[i] - meanY
    cov += dx * dy
    varX += dx * dx
    varY += dy * dy
  }

  if (varX === 0 || varY === 0) return null
  return cov / Math.sqrt(varX * varY)
}

// ── Correlation matrix ────────────────────────────────────────────────────

export function correlationMatrix(
  dataset: ParsedDataset,
  columns: string[],
): CorrelationMatrix {
  const excluded: { column: string; reason: string }[] = []
  const eligible: string[] = []

  for (const col of columns) {
    const values = dataset.rows
      .map((r) => r[col])
      .filter((v) => v !== null && v !== undefined && String(v).trim() !== '')
      .map(Number)
      .filter(isFinite)

    if (values.length < 2) {
      excluded.push({ column: col, reason: 'Insufficient data (< 2 numeric values)' })
      continue
    }

    const mean = values.reduce((s, v) => s + v, 0) / values.length
    const hasVariance = values.some((v) => v !== mean)
    if (!hasVariance) {
      excluded.push({ column: col, reason: 'Constant column (zero variance)' })
      continue
    }

    eligible.push(col)
  }

  const n = eligible.length
  const values: (number | null)[][] = Array.from({ length: n }, () => Array(n).fill(null))

  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      if (i === j) {
        values[i][j] = 1
        continue
      }

      // Collect paired values (both non-null)
      const xs: number[] = []
      const ys: number[] = []
      for (const row of dataset.rows) {
        const xv = row[eligible[i]]
        const yv = row[eligible[j]]
        if (xv !== null && xv !== undefined && yv !== null && yv !== undefined) {
          const xn = Number(xv)
          const yn = Number(yv)
          if (isFinite(xn) && isFinite(yn)) {
            xs.push(xn)
            ys.push(yn)
          }
        }
      }

      const r = pearsonCorrelation(xs, ys)
      values[i][j] = r
      values[j][i] = r
    }
  }

  return { columns: eligible, values, excluded }
}

// ── Linear regression ─────────────────────────────────────────────────────

export function linearRegression(
  x: number[],
  y: number[],
): { slope: number; intercept: number; rSquared: number } | null {
  if (x.length !== y.length || x.length < 2) return null

  const n = x.length
  const meanX = x.reduce((s, v) => s + v, 0) / n
  const meanY = y.reduce((s, v) => s + v, 0) / n

  let ssXX = 0
  let ssXY = 0
  for (let i = 0; i < n; i++) {
    ssXX += (x[i] - meanX) ** 2
    ssXY += (x[i] - meanX) * (y[i] - meanY)
  }

  if (ssXX === 0) return null

  const slope = ssXY / ssXX
  const intercept = meanY - slope * meanX

  // R²
  const ssTot = y.reduce((s, v) => s + (v - meanY) ** 2, 0)
  if (ssTot === 0) return null
  const ssRes = y.reduce((s, v, i) => s + (v - (slope * x[i] + intercept)) ** 2, 0)
  const rSquared = 1 - ssRes / ssTot

  return { slope, intercept, rSquared }
}

// ── Box plot ──────────────────────────────────────────────────────────────

export function computeBoxPlot(values: Numeric[]): BoxPlotStats {
  const numerics = sortedNumerics(values)
  if (numerics.length === 0) {
    return { min: 0, q1: 0, median: 0, q3: 0, max: 0, outliers: [] }
  }

  const q1 = percentile(numerics, 25)
  const q3 = percentile(numerics, 75)
  const iqr = q3 - q1
  const lowerFence = q1 - 1.5 * iqr
  const upperFence = q3 + 1.5 * iqr

  const inliers = numerics.filter((v) => v >= lowerFence && v <= upperFence)
  const outliers = numerics.filter((v) => v < lowerFence || v > upperFence)

  const min = inliers.length > 0 ? inliers[0] : numerics[0]
  const max = inliers.length > 0 ? inliers[inliers.length - 1] : numerics[numerics.length - 1]

  return {
    min,
    q1,
    median: percentile(numerics, 50),
    q3,
    max,
    outliers,
  }
}

// ── Histogram bins ────────────────────────────────────────────────────────

export function histogramBins(
  values: Numeric[],
  binCount: number,
): HistogramBin[] {
  const numerics = sortedNumerics(values)
  if (numerics.length === 0 || binCount < 1) return []

  const min = numerics[0]
  const max = numerics[numerics.length - 1]

  if (min === max) {
    // All identical values — one bin
    return [{
      start: min,
      end: max,
      count: numerics.length,
      label: String(min),
    }]
  }

  const binWidth = (max - min) / binCount
  const bins: HistogramBin[] = Array.from({ length: binCount }, (_, i) => {
    const start = min + i * binWidth
    const end = i === binCount - 1 ? max : start + binWidth
    return { start, end, count: 0, label: `${start.toFixed(2)}–${end.toFixed(2)}` }
  })

  for (const v of numerics) {
    // Last bin is inclusive on both ends
    if (v === max) {
      bins[binCount - 1].count++
      continue
    }
    const idx = Math.floor((v - min) / binWidth)
    if (idx >= 0 && idx < binCount) {
      bins[idx].count++
    }
  }

  return bins
}
