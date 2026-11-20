/**
 * aggregator.ts
 *
 * Aggregates rows grouped by a category column, computing a numeric value
 * per group using the specified aggregation method.
 */
import type { Row, AggregationMethod } from '../types'

export interface AggregatedRow {
  group: string
  value: number
  count: number
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

function variance(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  return values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1)
}

function computeAgg(values: number[], method: AggregationMethod): number {
  if (values.length === 0) return 0
  switch (method) {
    case 'sum': return values.reduce((s, v) => s + v, 0)
    case 'mean': return values.reduce((s, v) => s + v, 0) / values.length
    case 'median': return median(values)
    case 'count': return values.length
    case 'min': return Math.min(...values)
    case 'max': return Math.max(...values)
    case 'stddev': return stddev(values)
    case 'variance': return variance(values)
    default: return values.reduce((s, v) => s + v, 0)
  }
}

export function aggregate(
  rows: Row[],
  groupByCol: string,
  valueCol: string,
  method: AggregationMethod,
): AggregatedRow[] {
  const groups = new Map<string, number[]>()

  for (const row of rows) {
    const groupKey = String(row[groupByCol] ?? '(blank)')
    const rawVal = row[valueCol]
    const numVal = rawVal !== null && rawVal !== undefined && String(rawVal).trim() !== ''
      ? Number(rawVal)
      : null

    if (!groups.has(groupKey)) groups.set(groupKey, [])

    if (method === 'count') {
      // Count non-null values
      if (rawVal !== null && rawVal !== undefined && String(rawVal).trim() !== '') {
        groups.get(groupKey)!.push(1)
      }
    } else {
      if (numVal !== null && isFinite(numVal)) {
        groups.get(groupKey)!.push(numVal)
      }
    }
  }

  const result: AggregatedRow[] = []
  for (const [group, values] of groups) {
    result.push({
      group,
      value: computeAgg(values, method),
      count: values.length,
    })
  }

  return result
}
