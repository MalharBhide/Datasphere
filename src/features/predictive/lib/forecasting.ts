/**
 * forecasting.ts
 *
 * Pure functions for simple linear-trend time-series forecasting.
 * Handles common calendar intervals (daily, weekly, monthly), duplicate
 * timestamps, irregular spacing, and forecast-horizon warnings.
 */
import type { ParsedDataset, Row } from '../../cleaning/types'
import { linearRegression } from '../../visualization/lib/statsCalculator'

// ── Types ─────────────────────────────────────────────────────────────────

export interface ForecastInput {
  dataset: ParsedDataset
  dateCol: string
  valueCol: string
  periods: number   // 1–30
}

export interface ForecastPoint {
  label: string       // ISO date string or "Step N"
  value: number
  isForecast: boolean
}

export interface ForecastResult {
  historical: ForecastPoint[]
  forecast: ForecastPoint[]
  warnings: string[]
  excludedCount: number
  duplicatesAveraged: boolean
  intervalLabel: string   // "daily" | "weekly" | "monthly" | "observation order"
}

export interface ForecastError {
  kind: 'missing_column' | 'insufficient_data' | 'invalid_periods'
  message: string
}

// ── Calendar interval detection ────────────────────────────────────────────

type Interval = 'daily' | 'weekly' | 'monthly' | 'unknown'

const MS_DAY = 86_400_000
const MS_WEEK = 7 * MS_DAY
// A "month" in ms is imprecise — we detect it differently (see below)

function detectInterval(sortedDates: Date[]): Interval {
  if (sortedDates.length < 2) return 'unknown'

  const diffs: number[] = []
  for (let i = 1; i < sortedDates.length; i++) {
    diffs.push(sortedDates[i].getTime() - sortedDates[i - 1].getTime())
  }

  // ── Monthly: same day-of-month in consecutive months ─────────────────
  // Check whether all consecutive pairs differ by exactly 1 calendar month
  const isMonthly = sortedDates.every((d, i) => {
    if (i === 0) return true
    const prev = sortedDates[i - 1]
    const expectedMonth = prev.getMonth() + 1
    const expectedYear = expectedMonth > 11
      ? prev.getFullYear() + 1
      : prev.getFullYear()
    const normalizedMonth = expectedMonth % 12
    return (
      d.getFullYear() === expectedYear &&
      d.getMonth() === normalizedMonth
    )
  })
  if (isMonthly) return 'monthly'

  // ── Weekly: all diffs within ±1 hour of 7 days ────────────────────────
  const tolerance = 3_600_000 // 1 hour
  const isWeekly = diffs.every((d) => Math.abs(d - MS_WEEK) <= tolerance)
  if (isWeekly) return 'weekly'

  // ── Daily: all diffs within ±1 hour of 1 day ─────────────────────────
  const isDaily = diffs.every((d) => Math.abs(d - MS_DAY) <= tolerance)
  if (isDaily) return 'daily'

  return 'unknown'
}

function addInterval(date: Date, interval: Interval, steps: number): Date {
  if (interval === 'monthly') {
    // Use UTC methods to avoid local-timezone day-shift when adding months
    const d = new Date(date)
    d.setUTCMonth(d.getUTCMonth() + steps)
    return d
  }
  if (interval === 'weekly') {
    return new Date(date.getTime() + steps * MS_WEEK)
  }
  // daily
  return new Date(date.getTime() + steps * MS_DAY)
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// ── Main forecasting function ──────────────────────────────────────────────

export function runForecast(input: ForecastInput): ForecastResult | ForecastError {
  const { dataset, dateCol, valueCol, periods } = input

  if (!dataset.columns.includes(dateCol)) {
    return { kind: 'missing_column', message: `Column "${dateCol}" not found in dataset.` }
  }
  if (!dataset.columns.includes(valueCol)) {
    return { kind: 'missing_column', message: `Column "${valueCol}" not found in dataset.` }
  }
  if (periods < 1 || periods > 30) {
    return { kind: 'invalid_periods', message: 'Forecast periods must be between 1 and 30.' }
  }

  // ── 1. Filter rows that have a parseable date and finite numeric value ──
  const rawValid: { date: Date; value: number; original: Row }[] = []
  let excludedCount = 0

  for (const row of dataset.rows) {
    const dv = row[dateCol]
    const nv = row[valueCol]

    const dateStr = dv !== null && dv !== undefined ? String(dv).trim() : ''
    const parsed = dateStr ? new Date(dateStr) : null
    const dateOk = parsed !== null && !isNaN(parsed.getTime())

    const num = nv !== null && nv !== undefined && String(nv).trim() !== '' ? Number(nv) : NaN
    const numOk = isFinite(num)

    if (dateOk && numOk) {
      rawValid.push({ date: parsed!, value: num, original: row })
    } else {
      excludedCount++
    }
  }

  if (rawValid.length < 3) {
    return {
      kind: 'insufficient_data',
      message: `At least 3 valid observations are required. Found ${rawValid.length} after filtering.`,
    }
  }

  // ── 2. Sort chronologically ─────────────────────────────────────────────
  rawValid.sort((a, b) => a.date.getTime() - b.date.getTime())

  // ── 3. Detect and handle duplicate timestamps ───────────────────────────
  const warnings: string[] = []
  let duplicatesAveraged = false

  // Group by ISO date string
  const grouped = new Map<string, number[]>()
  for (const item of rawValid) {
    const key = formatDate(item.date)
    const existing = grouped.get(key) ?? []
    existing.push(item.value)
    grouped.set(key, existing)
  }

  const hasDuplicates = [...grouped.values()].some((arr) => arr.length > 1)
  if (hasDuplicates) {
    duplicatesAveraged = true
    warnings.push('Duplicate timestamps were found. Values for the same date have been averaged.')
  }

  // Build deduplicated ordered list
  const deduped: { key: string; date: Date; value: number }[] = []
  // Keep insertion order (already sorted)
  const seen = new Set<string>()
  for (const item of rawValid) {
    const key = formatDate(item.date)
    if (!seen.has(key)) {
      seen.add(key)
      const vals = grouped.get(key)!
      const avg = vals.reduce((s, v) => s + v, 0) / vals.length
      deduped.push({ key, date: item.date, value: avg })
    }
  }

  if (deduped.length < 3) {
    return {
      kind: 'insufficient_data',
      message: `After deduplication, only ${deduped.length} observations remain. At least 3 are required.`,
    }
  }

  // ── 4. Detect calendar interval ─────────────────────────────────────────
  const sortedDates = deduped.map((d) => d.date)
  const interval = detectInterval(sortedDates)
  const useOrderIndex = interval === 'unknown'

  if (useOrderIndex) {
    warnings.push(
      'A consistent date interval could not be determined. Forecasted labels use observation order (Step N).',
    )
  }

  if (periods > deduped.length) {
    warnings.push(
      `Forecast horizon (${periods} periods) exceeds the number of historical observations (${deduped.length}). Predictions become less reliable.`,
    )
  }

  const intervalLabel = useOrderIndex ? 'observation order' : interval

  // ── 5. Fit linear trend (index → value) ────────────────────────────────
  const xs = deduped.map((_, i) => i)
  const ys = deduped.map((d) => d.value)

  // linearRegression returns null only when xs are constant (impossible here) or length < 2
  const trend = linearRegression(xs, ys)
  // Fallback: if trend is somehow null, use mean as flat forecast
  const slope = trend?.slope ?? 0
  const intercept = trend?.intercept ?? (ys.reduce((s, v) => s + v, 0) / ys.length)

  // ── 6. Build historical points ──────────────────────────────────────────
  const historical: ForecastPoint[] = deduped.map((d) => ({
    label: d.key,
    value: d.value,
    isForecast: false,
  }))

  // ── 7. Build forecast points ────────────────────────────────────────────
  const lastDate = deduped[deduped.length - 1].date
  const lastIndex = deduped.length - 1

  const forecast: ForecastPoint[] = []
  for (let p = 1; p <= periods; p++) {
    const predictedValue = slope * (lastIndex + p) + intercept

    let label: string
    if (useOrderIndex) {
      label = `Step ${deduped.length + p}`
    } else {
      const futureDate = addInterval(lastDate, interval, p)
      label = formatDate(futureDate)
    }

    forecast.push({ label, value: predictedValue, isForecast: true })
  }

  return {
    historical,
    forecast,
    warnings,
    excludedCount,
    duplicatesAveraged,
    intervalLabel,
  }
}
