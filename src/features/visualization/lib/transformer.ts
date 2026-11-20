/**
 * transformer.ts
 *
 * Transforms a ParsedDataset by applying filters, sorting, and aggregation
 * before passing data to the ECharts builder.
 */
import type { ParsedDataset, Row, TransformConfig, TransformedDataset, FilterRule, FilterOperator } from '../types'
import { aggregate } from './aggregator'

// ── Filter operators ─────────────────────────────────────────────────────

function matchesFilter(row: Row, filter: FilterRule): boolean {
  const rawCell = row[filter.column]
  if (rawCell === null || rawCell === undefined) return false

  const cellStr = String(rawCell).toLowerCase().trim()
  const filterVal = filter.value.toLowerCase().trim()
  const cellNum = Number(rawCell)
  const filterNum = Number(filter.value)

  const op: FilterOperator = filter.operator
  switch (op) {
    case 'eq': return cellStr === filterVal
    case 'neq': return cellStr !== filterVal
    case 'gt': return isFinite(cellNum) && isFinite(filterNum) ? cellNum > filterNum : cellStr > filterVal
    case 'lt': return isFinite(cellNum) && isFinite(filterNum) ? cellNum < filterNum : cellStr < filterVal
    case 'gte': return isFinite(cellNum) && isFinite(filterNum) ? cellNum >= filterNum : cellStr >= filterVal
    case 'lte': return isFinite(cellNum) && isFinite(filterNum) ? cellNum <= filterNum : cellStr <= filterVal
    case 'contains': return cellStr.includes(filterVal)
    case 'not_contains': return !cellStr.includes(filterVal)
    default: return true
  }
}

// ── Date range filter ─────────────────────────────────────────────────────

function parseDate(val: string | number | null): number | null {
  if (val === null || val === undefined || String(val).trim() === '') return null
  const d = new Date(String(val))
  return isNaN(d.getTime()) ? null : d.getTime()
}

// ── Main transform ────────────────────────────────────────────────────────

export function transformDataset(
  dataset: ParsedDataset,
  config: TransformConfig,
): TransformedDataset {
  let rows = [...dataset.rows]
  let excludedRowCount = 0
  const excludedReasons: string[] = []

  // 1. Exclude missing values if requested
  if (config.excludeMissingValues) {
    const before = rows.length
    rows = rows.filter((row) =>
      dataset.columns.every((col) => {
        const v = row[col]
        return v !== null && v !== undefined && String(v).trim() !== ''
      }),
    )
    const removed = before - rows.length
    if (removed > 0) {
      excludedRowCount += removed
      excludedReasons.push(`${removed} rows with missing values excluded`)
    }
  }

  // 2. Apply filters
  for (const filter of config.filters) {
    if (!filter.column || !filter.value) continue
    const before = rows.length
    rows = rows.filter((row) => matchesFilter(row, filter))
    const removed = before - rows.length
    if (removed > 0) {
      excludedRowCount += removed
      excludedReasons.push(`${removed} rows removed by filter on "${filter.column}"`)
    }
  }

  // 3. Apply date range filter
  if (config.dateRange?.column && (config.dateRange.start || config.dateRange.end)) {
    const { column, start, end } = config.dateRange
    const startTs = start ? parseDate(start) : null
    const endTs = end ? parseDate(end) : null
    const before = rows.length
    rows = rows.filter((row) => {
      const ts = parseDate(row[column] as string | null)
      if (ts === null) return false
      if (startTs !== null && ts < startTs) return false
      if (endTs !== null && ts > endTs) return false
      return true
    })
    const removed = before - rows.length
    if (removed > 0) {
      excludedRowCount += removed
      excludedReasons.push(`${removed} rows outside date range excluded`)
    }
  }

  // 4. Sort
  for (const sortRule of [...config.sortRules].reverse()) {
    rows.sort((a, b) => {
      const aVal = a[sortRule.column]
      const bVal = b[sortRule.column]
      const aNum = Number(aVal)
      const bNum = Number(bVal)

      let cmp: number
      if (isFinite(aNum) && isFinite(bNum)) {
        cmp = aNum - bNum
      } else {
        cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''))
      }
      return sortRule.direction === 'asc' ? cmp : -cmp
    })
  }

  // 5. Group-by aggregation
  let wasAggregated = false
  if (config.aggregation.method !== 'none' && config.aggregation.groupByColumn) {
    const { method, groupByColumn } = config.aggregation
    // We need to know the value column — but transformer doesn't know the chart field mapping.
    // The caller must pass the value column via a convention:
    // If groupByColumn is set without a valueColumn, we'll use a numeric column detected.
    // For now, aggregation is applied per groupByColumn+valueCol pair.
    // Value column resolution happens in the page component that calls us.
    wasAggregated = true

    // Find first numeric column that isn't the groupByColumn
    const firstNumericCol = dataset.columns.find((c) => {
      if (c === groupByColumn) return false
      return rows.some((r) => r[c] !== null && isFinite(Number(r[c])))
    })

    if (firstNumericCol) {
      const agg = aggregate(rows, groupByColumn, firstNumericCol, method)
      rows = agg.map((a) => ({ [groupByColumn]: a.group, [firstNumericCol]: a.value }))
    }
  }

  return {
    columns: dataset.columns,
    rows,
    excludedRowCount,
    excludedReasons,
    wasAggregated,
  }
}

/**
 * Targeted aggregation: aggregate a specific value column grouped by a specific key column.
 * Returns a TransformedDataset where each row has {keyCol: group, valueCol: aggValue}.
 */
export function transformWithAggregation(
  dataset: ParsedDataset,
  config: TransformConfig,
  keyCol: string,
  valueCol: string,
): TransformedDataset {
  // First apply filters and sort
  const base = transformDataset(dataset, {
    ...config,
    aggregation: { method: 'none' }, // Skip generic aggregation — we handle it here
  })

  if (config.aggregation.method === 'none' || !keyCol || !valueCol) {
    return base
  }

  const agg = aggregate(base.rows, keyCol, valueCol, config.aggregation.method)
  const rows = agg.map((a) => ({ [keyCol]: a.group, [valueCol]: a.value }))

  return {
    columns: [keyCol, valueCol],
    rows,
    excludedRowCount: base.excludedRowCount,
    excludedReasons: base.excludedReasons,
    wasAggregated: true,
  }
}
