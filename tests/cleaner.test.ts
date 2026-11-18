import { describe, it, expect } from 'vitest'
import { applyCleaningOperations } from '../src/features/cleaning/lib/cleaner'
import type { ParsedDataset, SelectedOperation } from '../src/features/cleaning/types'

function makeDataset(columns: string[], rows: Record<string, unknown>[]): ParsedDataset {
  return {
    fileName: 'test.csv',
    columns,
    rows: rows as ParsedDataset['rows'],
  }
}

function op(id: string, params?: SelectedOperation['action']['params']): SelectedOperation {
  return { action: { id, label: id, params }, enabled: true }
}

describe('remove duplicates', () => {
  it('removes exact duplicate rows', () => {
    const row = { a: '1', b: '2' }
    const ds = makeDataset(['a', 'b'], [row, row, row, { a: '3', b: '4' }])
    const result = applyCleaningOperations(ds, [op('remove_duplicates')])
    expect(result.finalRowCount).toBe(2)
    expect(result.originalRowCount).toBe(4)
    expect(result.changeSummary[0].count).toBe(2)
  })

  it('does not remove unique rows', () => {
    const ds = makeDataset(['a'], [{ a: '1' }, { a: '2' }, { a: '3' }])
    const result = applyCleaningOperations(ds, [op('remove_duplicates')])
    expect(result.finalRowCount).toBe(3)
    expect(result.changeSummary).toHaveLength(0)
  })

  it('does not mutate the original dataset', () => {
    const row = { a: '1' }
    const ds = makeDataset(['a'], [row, row])
    const originalLength = ds.rows.length
    applyCleaningOperations(ds, [op('remove_duplicates')])
    expect(ds.rows).toHaveLength(originalLength)
  })
})

describe('trim whitespace', () => {
  it('trims leading and trailing whitespace', () => {
    const ds = makeDataset(['a'], [{ a: '  hello  ' }, { a: ' tab' }, { a: 'clean' }])
    const result = applyCleaningOperations(ds, [op('trim_whitespace')])
    expect(result.cleanedRows[0].a).toBe('hello')
    expect(result.cleanedRows[1].a).toBe('tab')
    expect(result.cleanedRows[2].a).toBe('clean')
    expect(result.changeSummary[0].count).toBe(2)
  })

  it('marks changed cells in changedCells set', () => {
    const ds = makeDataset(['name'], [{ name: ' Alice ' }])
    const result = applyCleaningOperations(ds, [op('trim_whitespace')])
    expect(result.changedCells.has('0:name')).toBe(true)
  })

  it('does not mark already-trimmed cells as changed', () => {
    const ds = makeDataset(['name'], [{ name: 'Alice' }])
    const result = applyCleaningOperations(ds, [op('trim_whitespace')])
    expect(result.changedCells.has('0:name')).toBe(false)
  })
})

describe('convert numeric text', () => {
  it('converts numeric string to number', () => {
    const ds = makeDataset(['age'], [{ age: '42' }, { age: '3.14' }])
    const result = applyCleaningOperations(ds, [op('convert_numeric')])
    expect(result.cleanedRows[0].age).toBe(42)
    expect(result.cleanedRows[1].age).toBe(3.14)
  })

  it('converts "42.5" to 42.5', () => {
    const ds = makeDataset(['v'], [{ v: '42.5' }])
    const result = applyCleaningOperations(ds, [op('convert_numeric')])
    expect(result.cleanedRows[0].v).toBe(42.5)
  })

  it('does not convert strings with leading zeros', () => {
    const ds = makeDataset(['zip'], [{ zip: '01234' }])
    const result = applyCleaningOperations(ds, [op('convert_numeric')])
    expect(result.cleanedRows[0].zip).toBe('01234')
  })

  it('does not convert non-numeric strings', () => {
    const ds = makeDataset(['name'], [{ name: 'Alice' }])
    const result = applyCleaningOperations(ds, [op('convert_numeric')])
    expect(result.cleanedRows[0].name).toBe('Alice')
  })
})

describe('fill missing values', () => {
  it('fills with median', () => {
    const ds = makeDataset(['score'], [
      { score: 10 }, { score: 20 }, { score: null }, { score: 30 },
    ])
    const result = applyCleaningOperations(ds, [
      op('fill_median', { fillStrategy: 'median' }),
    ])
    // Sorted: [10, 20, 30] → median = 20
    expect(result.cleanedRows[2].score).toBe(20)
  })

  it('fills with mean', () => {
    const ds = makeDataset(['score'], [
      { score: 10 }, { score: 20 }, { score: null }, { score: 30 },
    ])
    const result = applyCleaningOperations(ds, [
      op('fill_mean', { fillStrategy: 'mean' }),
    ])
    // Mean of [10, 20, 30] = 20
    expect(result.cleanedRows[2].score).toBe(20)
  })

  it('fills with custom numeric value', () => {
    const ds = makeDataset(['v'], [{ v: null }])
    const result = applyCleaningOperations(ds, [
      op('fill_custom', { fillStrategy: 'custom', customValue: '99' }),
    ])
    expect(result.cleanedRows[0].v).toBe(99)
  })

  it('fills with custom string value when not numeric', () => {
    const ds = makeDataset(['status'], [{ status: null }])
    const result = applyCleaningOperations(ds, [
      op('fill_custom', { fillStrategy: 'custom', customValue: 'Unknown' }),
    ])
    expect(result.cleanedRows[0].status).toBe('Unknown')
  })

  it('handles all-null column gracefully (no fill for median/mean)', () => {
    const ds = makeDataset(['v'], [{ v: null }, { v: null }])
    const result = applyCleaningOperations(ds, [
      op('fill_median', { fillStrategy: 'median' }),
    ])
    // No numeric values to compute median from → nulls remain
    expect(result.cleanedRows[0].v).toBeNull()
  })
})

describe('standardize casing', () => {
  it('applies title case', () => {
    const ds = makeDataset(['city'], [{ city: 'new york' }, { city: 'CHICAGO' }])
    const result = applyCleaningOperations(ds, [
      op('standardize_casing_city', { column: 'city', capStyle: 'title' }),
    ])
    expect(result.cleanedRows[0].city).toBe('New York')
    expect(result.cleanedRows[1].city).toBe('Chicago')
  })

  it('applies uppercase', () => {
    const ds = makeDataset(['city'], [{ city: 'new york' }])
    const result = applyCleaningOperations(ds, [
      op('standardize_casing_city', { column: 'city', capStyle: 'upper' }),
    ])
    expect(result.cleanedRows[0].city).toBe('NEW YORK')
  })

  it('applies lowercase', () => {
    const ds = makeDataset(['city'], [{ city: 'NEW YORK' }])
    const result = applyCleaningOperations(ds, [
      op('standardize_casing_city', { column: 'city', capStyle: 'lower' }),
    ])
    expect(result.cleanedRows[0].city).toBe('new york')
  })
})

describe('combined operations', () => {
  it('applies operations in correct order (dup removal before trim)', () => {
    const ds = makeDataset(['name'], [
      { name: ' Alice ' },
      { name: ' Alice ' }, // duplicate
      { name: 'Bob' },
    ])
    const result = applyCleaningOperations(ds, [
      op('remove_duplicates'),
      op('trim_whitespace'),
    ])
    expect(result.finalRowCount).toBe(2)
    expect(result.cleanedRows[0].name).toBe('Alice')
    expect(result.cleanedRows[1].name).toBe('Bob')
  })

  it('does not apply disabled operations', () => {
    const ds = makeDataset(['name'], [{ name: '  hello  ' }])
    const result = applyCleaningOperations(ds, [
      { action: { id: 'trim_whitespace', label: 'Trim' }, enabled: false },
    ])
    expect(result.cleanedRows[0].name).toBe('  hello  ')
  })
})

// ── Regression: Fix 2 — Custom fill value validation ──────────────────────────

describe('fill missing values — custom value edge cases', () => {
  it('does NOT fill when customValue is an empty string', () => {
    const ds = makeDataset(['v'], [{ v: null }])
    const result = applyCleaningOperations(ds, [
      op('fill_custom', { fillStrategy: 'custom', customValue: '' }),
    ])
    // No fill should happen — null remains
    expect(result.cleanedRows[0].v).toBeNull()
    expect(result.changeSummary).toHaveLength(0)
  })

  it('does NOT fill when customValue is whitespace only', () => {
    const ds = makeDataset(['v'], [{ v: null }])
    const result = applyCleaningOperations(ds, [
      op('fill_custom', { fillStrategy: 'custom', customValue: '   ' }),
    ])
    expect(result.cleanedRows[0].v).toBeNull()
    expect(result.changeSummary).toHaveLength(0)
  })

  it('fills with numeric 0 when customValue is "0"', () => {
    const ds = makeDataset(['v'], [{ v: null }, { v: null }])
    const result = applyCleaningOperations(ds, [
      op('fill_custom', { fillStrategy: 'custom', customValue: '0' }),
    ])
    expect(result.cleanedRows[0].v).toBe(0)
    expect(result.cleanedRows[1].v).toBe(0)
    expect(result.changeSummary[0].count).toBe(2)
  })

  it('fills with string value and reports correct change count', () => {
    const ds = makeDataset(['status'], [{ status: null }, { status: 'active' }, { status: null }])
    const result = applyCleaningOperations(ds, [
      op('fill_custom', { fillStrategy: 'custom', customValue: 'unknown' }),
    ])
    expect(result.cleanedRows[0].status).toBe('unknown')
    expect(result.cleanedRows[1].status).toBe('active') // unchanged
    expect(result.cleanedRows[2].status).toBe('unknown')
    expect(result.changeSummary[0].count).toBe(2)
  })

  it('trims the customValue before using it', () => {
    // "  42  " should fill as the number 42 after trimming
    const ds = makeDataset(['score'], [{ score: null }])
    const result = applyCleaningOperations(ds, [
      op('fill_custom', { fillStrategy: 'custom', customValue: '  42  ' }),
    ])
    expect(result.cleanedRows[0].score).toBe(42)
  })
})

