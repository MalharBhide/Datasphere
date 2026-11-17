import type {
  ParsedDataset,
  DetectedIssue,
  CleaningAction,
  CellValue,
  Row,
} from '../types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function isEmpty(val: CellValue): boolean {
  return val === null || val === undefined || String(val).trim() === ''
}

function isNumericString(val: CellValue): boolean {
  if (typeof val !== 'string') return false
  const t = val.trim()
  if (t === '') return false
  // Guard: leading zeros → likely ID/zip code
  if (/^0\d/.test(t)) return false
  return isFinite(Number(t))
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

function canonicalRow(row: Row): string {
  return JSON.stringify(row)
}

// ── Detectors ────────────────────────────────────────────────────────────────

function detectMissingValues(dataset: ParsedDataset): DetectedIssue | null {
  let totalCount = 0
  const affectedColumns: string[] = []
  let example = ''

  for (const col of dataset.columns) {
    let colCount = 0
    for (const row of dataset.rows) {
      if (isEmpty(row[col])) {
        colCount++
        if (!example) example = `Column "${col}" has an empty cell`
      }
    }
    if (colCount > 0) {
      totalCount += colCount
      affectedColumns.push(col)
    }
  }

  if (totalCount === 0) return null

  const actions: CleaningAction[] = [
    {
      id: 'fill_median',
      label: 'Fill with median (numeric columns)',
      params: { fillStrategy: 'median' },
    },
    {
      id: 'fill_mean',
      label: 'Fill with mean (numeric columns)',
      params: { fillStrategy: 'mean' },
    },
    {
      id: 'fill_custom',
      label: 'Fill with custom value',
      params: { fillStrategy: 'custom', customValue: '' },
    },
  ]

  return {
    kind: 'missing_values',
    affectedCount: totalCount,
    affectedColumns,
    explanation: `${totalCount} cell${totalCount === 1 ? '' : 's'} in ${affectedColumns.length} column${affectedColumns.length === 1 ? '' : 's'} ${totalCount === 1 ? 'is' : 'are'} empty or null.`,
    example,
    availableActions: actions,
  }
}

function detectDuplicateRows(dataset: ParsedDataset): DetectedIssue | null {
  const seen = new Set<string>()
  let count = 0
  let example = ''

  for (const row of dataset.rows) {
    const key = canonicalRow(row)
    if (seen.has(key)) {
      count++
      if (!example) {
        const preview = dataset.columns
          .slice(0, 3)
          .map((c) => `${c}: ${row[c] ?? ''}`)
          .join(', ')
        example = `{${preview}}`
      }
    } else {
      seen.add(key)
    }
  }

  if (count === 0) return null

  return {
    kind: 'duplicate_rows',
    affectedCount: count,
    affectedColumns: [],
    explanation: `${count} duplicate row${count === 1 ? '' : 's'} found that would be removed.`,
    example,
    availableActions: [{ id: 'remove_duplicates', label: 'Remove duplicate rows' }],
  }
}

function detectWhitespace(dataset: ParsedDataset): DetectedIssue | null {
  let count = 0
  const affectedColumns = new Set<string>()
  let example = ''

  for (const col of dataset.columns) {
    for (const row of dataset.rows) {
      const val = row[col]
      if (typeof val === 'string' && val !== val.trim()) {
        count++
        affectedColumns.add(col)
        if (!example) example = `"${val}" → "${val.trim()}"`
      }
    }
  }

  if (count === 0) return null

  return {
    kind: 'whitespace',
    affectedCount: count,
    affectedColumns: [...affectedColumns],
    explanation: `${count} cell${count === 1 ? '' : 's'} have leading or trailing whitespace.`,
    example,
    availableActions: [{ id: 'trim_whitespace', label: 'Trim whitespace from all text cells' }],
  }
}

function detectNumericAsText(dataset: ParsedDataset): DetectedIssue | null {
  let count = 0
  const affectedColumns = new Set<string>()
  let example = ''

  for (const col of dataset.columns) {
    // Count how many non-null values in this column look numeric as strings
    const nonNull = dataset.rows
      .map((r) => r[col])
      .filter((v) => v !== null)
    if (nonNull.length === 0) continue

    const numericStrings = nonNull.filter(isNumericString)
    // Only flag if >50% of non-null column values are numeric strings
    if (numericStrings.length / nonNull.length <= 0.5) continue

    count += numericStrings.length
    affectedColumns.add(col)
    if (!example && numericStrings.length > 0) {
      example = `Column "${col}": value "${numericStrings[0]}" stored as text`
    }
  }

  if (count === 0) return null

  return {
    kind: 'numeric_as_text',
    affectedCount: count,
    affectedColumns: [...affectedColumns],
    explanation: `${count} cell${count === 1 ? '' : 's'} in ${affectedColumns.size} column${affectedColumns.size === 1 ? '' : 's'} contain numeric values stored as text.`,
    example,
    availableActions: [{ id: 'convert_numeric', label: 'Convert numeric text to numbers' }],
  }
}

function detectInconsistentCasing(dataset: ParsedDataset): DetectedIssue | null {
  const affectedColumns: string[] = []
  const exampleParts: string[] = []

  for (const col of dataset.columns) {
    const nonNullVals = dataset.rows
      .map((r) => r[col])
      .filter((v) => v !== null && v !== undefined)

    if (nonNullVals.length === 0) continue

    // Only target text-dominant columns (>80% string values)
    const stringVals = nonNullVals.filter((v) => typeof v === 'string') as string[]
    if (stringVals.length / nonNullVals.length < 0.8) continue

    // Group by lowercase
    const groups = new Map<string, Set<string>>()
    for (const val of stringVals) {
      const lower = val.toLowerCase()
      if (!groups.has(lower)) groups.set(lower, new Set())
      groups.get(lower)!.add(val)
    }

    // Find any lowercase key that maps to >1 casing variant
    let hasInconsistency = false
    for (const [, variants] of groups) {
      if (variants.size > 1) {
        hasInconsistency = true
        if (exampleParts.length < 2) {
          exampleParts.push(
            `Column "${col}": ${[...variants].slice(0, 3).join(', ')}`,
          )
        }
        break
      }
    }

    if (hasInconsistency) affectedColumns.push(col)
  }

  if (affectedColumns.length === 0) return null

  const actions: CleaningAction[] = affectedColumns.map((col) => ({
    id: `standardize_casing_${col}`,
    label: `Standardize casing in "${col}"`,
    params: { column: col, capStyle: 'title' },
  }))

  return {
    kind: 'inconsistent_casing',
    affectedCount: affectedColumns.length,
    affectedColumns,
    explanation: `${affectedColumns.length} column${affectedColumns.length === 1 ? '' : 's'} ${affectedColumns.length === 1 ? 'has' : 'have'} inconsistent capitalization.`,
    example: exampleParts.join(' | '),
    availableActions: actions,
  }
}

function detectOutliers(dataset: ParsedDataset): DetectedIssue | null {
  let count = 0
  const affectedColumns: string[] = []
  const exampleParts: string[] = []

  for (const col of dataset.columns) {
    const nonNull = dataset.rows
      .map((r) => r[col])
      .filter((v) => v !== null)

    if (nonNull.length < 4) continue // too few points for IQR

    // Parse numeric values (handles both number and numeric string)
    const numericVals = nonNull
      .map((v) => (typeof v === 'number' ? v : Number(String(v).trim())))
      .filter((v) => isFinite(v))

    // Only analyze columns where >80% of non-null values are numeric
    if (numericVals.length / nonNull.length < 0.8) continue

    const sorted = [...numericVals].sort((a, b) => a - b)
    const q1 = percentile(sorted, 25)
    const q3 = percentile(sorted, 75)
    const iqr = q3 - q1

    if (iqr === 0) continue // no spread → no outliers by IQR

    const lo = q1 - 1.5 * iqr
    const hi = q3 + 1.5 * iqr

    const colOutliers = numericVals.filter((v) => v < lo || v > hi)
    if (colOutliers.length > 0) {
      count += colOutliers.length
      affectedColumns.push(col)
      if (exampleParts.length < 2) {
        exampleParts.push(
          `Column "${col}": ${colOutliers.slice(0, 3).join(', ')} (bounds: ${lo.toFixed(2)}–${hi.toFixed(2)})`,
        )
      }
    }
  }

  if (count === 0) return null

  return {
    kind: 'outliers',
    affectedCount: count,
    affectedColumns,
    explanation: `${count} suspected numeric outlier${count === 1 ? '' : 's'} detected using the IQR method. These are flagged only — no automatic removal.`,
    example: exampleParts.join(' | '),
    availableActions: [], // outliers are flagged only, not auto-removed
  }
}

// ── Main export ──────────────────────────────────────────────────────────────

export function analyzeDataset(dataset: ParsedDataset): DetectedIssue[] {
  const checks = [
    detectMissingValues,
    detectDuplicateRows,
    detectWhitespace,
    detectNumericAsText,
    detectInconsistentCasing,
    detectOutliers,
  ]
  return checks
    .map((fn) => fn(dataset))
    .filter((issue): issue is DetectedIssue => issue !== null)
}
