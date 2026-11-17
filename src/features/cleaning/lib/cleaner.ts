import type {
  ParsedDataset,
  SelectedOperation,
  CleaningResult,
  Row,
  CellValue,
} from '../types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function isEmpty(val: CellValue): boolean {
  return val === null || val === undefined || String(val).trim() === ''
}

function toNumber(val: CellValue): number | null {
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    const n = Number(val.trim())
    return isFinite(n) ? n : null
  }
  return null
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0
  const s = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid]
}

function mean(nums: number[]): number {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function applyCapStyle(str: string, style: 'title' | 'upper' | 'lower'): string {
  if (style === 'upper') return str.toUpperCase()
  if (style === 'lower') return str.toLowerCase()
  // title case: lowercase everything first, then uppercase first char of each word
  return str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function isNumericString(val: CellValue): boolean {
  if (typeof val !== 'string') return false
  const t = val.trim()
  if (t === '') return false
  if (/^0\d/.test(t)) return false
  return isFinite(Number(t))
}

function canonicalRow(row: Row): string {
  return JSON.stringify(row)
}

function deepCloneRows(rows: Row[]): Row[] {
  return rows.map((r) => ({ ...r }))
}

// ── Cleaning operations ───────────────────────────────────────────────────────

function removeDuplicates(
  rows: Row[],
  changedCells: Set<string>,
): { rows: Row[]; count: number } {
  const seen = new Set<string>()
  const result: Row[] = []
  let count = 0
  for (const row of rows) {
    const key = canonicalRow(row)
    if (seen.has(key)) {
      count++
    } else {
      seen.add(key)
      result.push(row)
    }
  }
  void changedCells // row removal doesn't create individual changed cells
  return { rows: result, count }
}

function trimWhitespace(
  rows: Row[],
  columns: string[],
  changedCells: Set<string>,
): number {
  let count = 0
  for (let i = 0; i < rows.length; i++) {
    for (const col of columns) {
      const val = rows[i][col]
      if (typeof val === 'string' && val !== val.trim()) {
        rows[i][col] = val.trim()
        changedCells.add(`${i}:${col}`)
        count++
      }
    }
  }
  return count
}

function convertNumericText(
  rows: Row[],
  columns: string[],
  changedCells: Set<string>,
): number {
  let count = 0
  for (let i = 0; i < rows.length; i++) {
    for (const col of columns) {
      const val = rows[i][col]
      if (isNumericString(val)) {
        rows[i][col] = Number((val as string).trim())
        changedCells.add(`${i}:${col}`)
        count++
      }
    }
  }
  return count
}

function fillMissingValues(
  rows: Row[],
  columns: string[],
  strategy: 'median' | 'mean' | 'custom',
  customValue: string,
  changedCells: Set<string>,
): number {
  let count = 0

  for (const col of columns) {
    // Compute fill value for this column
    let fillVal: CellValue

    if (strategy === 'custom') {
      // Try to parse as number, otherwise keep as string
      const n = Number(customValue)
      fillVal = customValue !== '' && isFinite(n) ? n : customValue
    } else {
      // Collect numeric non-null values
      const nums = rows
        .map((r) => toNumber(r[col]))
        .filter((n): n is number => n !== null)

      if (nums.length === 0) continue // can't compute stat for non-numeric column

      fillVal = strategy === 'median' ? median(nums) : mean(nums)
    }

    for (let i = 0; i < rows.length; i++) {
      if (isEmpty(rows[i][col])) {
        rows[i][col] = fillVal
        changedCells.add(`${i}:${col}`)
        count++
      }
    }
  }

  return count
}

function standardizeCasing(
  rows: Row[],
  col: string,
  style: 'title' | 'upper' | 'lower',
  changedCells: Set<string>,
): number {
  let count = 0
  for (let i = 0; i < rows.length; i++) {
    const val = rows[i][col]
    if (typeof val === 'string') {
      const transformed = applyCapStyle(val, style)
      if (transformed !== val) {
        rows[i][col] = transformed
        changedCells.add(`${i}:${col}`)
        count++
      }
    }
  }
  return count
}

// ── Main export ───────────────────────────────────────────────────────────────

export function applyCleaningOperations(
  dataset: ParsedDataset,
  operations: SelectedOperation[],
): CleaningResult {
  const enabled = operations.filter((op) => op.enabled)
  let rows = deepCloneRows(dataset.rows)
  const changedCells = new Set<string>()
  const summary: Array<{ operation: string; count: number; description: string }> = []

  // 1. Remove duplicates
  const removeDupOp = enabled.find((op) => op.action.id === 'remove_duplicates')
  if (removeDupOp) {
    const { rows: deduped, count } = removeDuplicates(rows, changedCells)
    rows = deduped
    if (count > 0) {
      summary.push({
        operation: 'Remove Duplicates',
        count,
        description: `Removed ${count} duplicate row${count === 1 ? '' : 's'}.`,
      })
    }
  }

  // 2. Trim whitespace
  const trimOp = enabled.find((op) => op.action.id === 'trim_whitespace')
  if (trimOp) {
    const count = trimWhitespace(rows, dataset.columns, changedCells)
    if (count > 0) {
      summary.push({
        operation: 'Trim Whitespace',
        count,
        description: `Trimmed whitespace in ${count} cell${count === 1 ? '' : 's'}.`,
      })
    }
  }

  // 3. Convert numeric text
  const convertOp = enabled.find((op) => op.action.id === 'convert_numeric')
  if (convertOp) {
    const count = convertNumericText(rows, dataset.columns, changedCells)
    if (count > 0) {
      summary.push({
        operation: 'Convert Numeric Text',
        count,
        description: `Converted ${count} cell${count === 1 ? '' : 's'} from text to numbers.`,
      })
    }
  }

  // 4. Fill missing values
  const fillOps = enabled.filter((op) =>
    ['fill_median', 'fill_mean', 'fill_custom'].includes(op.action.id),
  )
  for (const fillOp of fillOps) {
    const strategy = fillOp.action.params?.fillStrategy ?? 'median'
    const customValue = fillOp.action.params?.customValue ?? ''
    const count = fillMissingValues(
      rows,
      dataset.columns,
      strategy,
      customValue,
      changedCells,
    )
    if (count > 0) {
      const strategyLabel =
        strategy === 'custom' ? `"${customValue}"` : strategy
      summary.push({
        operation: 'Fill Missing Values',
        count,
        description: `Filled ${count} missing cell${count === 1 ? '' : 's'} using ${strategyLabel}.`,
      })
    }
  }

  // 5. Standardize capitalization (per column)
  const casingOps = enabled.filter((op) =>
    op.action.id.startsWith('standardize_casing_'),
  )
  for (const casingOp of casingOps) {
    const col = casingOp.action.params?.column
    const style = casingOp.action.params?.capStyle ?? 'title'
    if (!col) continue
    const count = standardizeCasing(rows, col, style, changedCells)
    if (count > 0) {
      const styleLabel = style === 'title' ? 'Title Case' : style === 'upper' ? 'UPPERCASE' : 'lowercase'
      summary.push({
        operation: 'Standardize Casing',
        count,
        description: `Applied ${styleLabel} to ${count} cell${count === 1 ? '' : 's'} in "${col}".`,
      })
    }
  }

  return {
    cleanedRows: rows,
    originalRowCount: dataset.rows.length,
    finalRowCount: rows.length,
    changeSummary: summary,
    changedCells,
  }
}
