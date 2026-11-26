/**
 * fieldDetector.ts
 *
 * Analyzes a ParsedDataset and classifies each column as:
 *   numeric | categorical | date | boolean
 */
import type { ParsedDataset } from '../../cleaning/types'
import type { ColumnMeta, FieldType } from '../types'

// ISO date patterns we recognize
const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}$/,                          // YYYY-MM-DD
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/,               // ISO datetime
  /^\d{2}\/\d{2}\/\d{4}$/,                         // MM/DD/YYYY
  /^\d{2}-\d{2}-\d{4}$/,                           // MM-DD-YYYY
  /^\d{4}\/\d{2}\/\d{2}$/,                         // YYYY/MM/DD
]

const BOOLEAN_VALUES = new Set(['true', 'false', 'yes', 'no', '1', '0', 'y', 'n'])

function isNumericValue(v: string | number | null): v is number | string {
  if (v === null || v === undefined) return false
  if (typeof v === 'number') return isFinite(v)
  if (typeof v === 'string') {
    const trimmed = v.trim()
    if (trimmed === '') return false
    // Guard against leading-zero strings like "007" or "00123" being treated as numeric
    if (/^0\d/.test(trimmed)) return false
    const num = Number(trimmed)
    return isFinite(num)
  }
  return false
}

function isDateValue(v: string | number | null): boolean {
  if (v === null || v === undefined) return false
  const s = String(v).trim()
  return DATE_PATTERNS.some((p) => p.test(s))
}

export function detectColumnTypes(dataset: ParsedDataset): ColumnMeta[] {
  return dataset.columns.map((col) => {
    const allValues = dataset.rows.map((r) => r[col] ?? null)
    const nonNullValues = allValues.filter((v) => v !== null && v !== undefined && String(v).trim() !== '')
    const totalCount = allValues.length
    const nonNullCount = nonNullValues.length

    // Unique values (capped at 100)
    const seen = new Set<string | number>()
    const uniqueValues: (string | number)[] = []
    for (const v of nonNullValues) {
      const key = typeof v === 'number' ? v : String(v)
      if (!seen.has(key) && uniqueValues.length < 100) {
        seen.add(key)
        uniqueValues.push(typeof v === 'number' ? v : String(v))
      }
    }

    let type: FieldType = 'categorical'

    if (nonNullCount === 0) {
      // All null — treat as categorical
      type = 'categorical'
    } else {
      // ── Boolean detection: exactly 2 unique non-null values, both recognized boolean strings
      const uniqueLower = uniqueValues.map((v) => String(v).toLowerCase().trim())
      if (uniqueLower.length <= 2 && uniqueLower.every((v) => BOOLEAN_VALUES.has(v))) {
        type = 'boolean'
      } else {
        // ── Numeric detection: >80% of non-null values parse as finite numbers
        const numericCount = nonNullValues.filter(isNumericValue).length
        if (numericCount / nonNullCount > 0.8) {
          type = 'numeric'
        } else {
          // ── Date detection: >80% of non-null values match a date pattern
          const dateCount = nonNullValues.filter(isDateValue).length
          if (dateCount / nonNullCount > 0.8) {
            type = 'date'
          }
          // Otherwise remains 'categorical'
        }
      }
    }

    return {
      name: col,
      type,
      nonNullCount,
      totalCount,
      uniqueValues,
    }
  })
}
