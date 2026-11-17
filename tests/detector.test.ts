import { describe, it, expect } from 'vitest'
import { analyzeDataset } from '../src/features/cleaning/lib/detector'
import type { ParsedDataset } from '../src/features/cleaning/types'

function makeDataset(columns: string[], rows: Record<string, unknown>[]): ParsedDataset {
  return {
    fileName: 'test.csv',
    columns,
    rows: rows as ParsedDataset['rows'],
  }
}

describe('detectMissingValues', () => {
  it('detects null and empty string cells', () => {
    const ds = makeDataset(['a', 'b'], [
      { a: 'hello', b: null },
      { a: '', b: '  ' },
      { a: 'world', b: '42' },
    ])
    const issues = analyzeDataset(ds)
    const issue = issues.find((i) => i.kind === 'missing_values')
    expect(issue).toBeDefined()
    expect(issue!.affectedCount).toBe(3) // null, '', '  '
  })

  it('returns no issue when all cells are filled', () => {
    const ds = makeDataset(['a'], [{ a: 'x' }, { a: 'y' }])
    const issues = analyzeDataset(ds)
    expect(issues.find((i) => i.kind === 'missing_values')).toBeUndefined()
  })
})

describe('detectDuplicateRows', () => {
  it('counts duplicate rows correctly', () => {
    const row = { a: '1', b: '2' }
    const ds = makeDataset(['a', 'b'], [row, row, row, { a: '3', b: '4' }])
    const issues = analyzeDataset(ds)
    const issue = issues.find((i) => i.kind === 'duplicate_rows')
    expect(issue).toBeDefined()
    expect(issue!.affectedCount).toBe(2) // 2 rows would be removed
  })

  it('returns no issue for unique rows', () => {
    const ds = makeDataset(['a'], [{ a: '1' }, { a: '2' }])
    const issues = analyzeDataset(ds)
    expect(issues.find((i) => i.kind === 'duplicate_rows')).toBeUndefined()
  })
})

describe('detectWhitespace', () => {
  it('detects leading and trailing whitespace', () => {
    const ds = makeDataset(['a'], [
      { a: '  hello  ' },
      { a: 'world' },
      { a: ' tab' },
    ])
    const issues = analyzeDataset(ds)
    const issue = issues.find((i) => i.kind === 'whitespace')
    expect(issue).toBeDefined()
    expect(issue!.affectedCount).toBe(2)
  })

  it('does not flag already-trimmed values', () => {
    const ds = makeDataset(['a'], [{ a: 'hello' }, { a: 'world' }])
    const issues = analyzeDataset(ds)
    expect(issues.find((i) => i.kind === 'whitespace')).toBeUndefined()
  })
})

describe('detectNumericAsText', () => {
  it('detects numeric strings in a text column', () => {
    const ds = makeDataset(['age'], [
      { age: '29' },
      { age: '34' },
      { age: '41' },
    ])
    const issues = analyzeDataset(ds)
    const issue = issues.find((i) => i.kind === 'numeric_as_text')
    expect(issue).toBeDefined()
    expect(issue!.affectedColumns).toContain('age')
  })

  it('does not flag strings with leading zeros (zip codes / IDs)', () => {
    const ds = makeDataset(['zip'], [
      { zip: '01234' },
      { zip: '02345' },
      { zip: '03456' },
    ])
    const issues = analyzeDataset(ds)
    expect(issues.find((i) => i.kind === 'numeric_as_text')).toBeUndefined()
  })

  it('does not flag a column with less than 50% numeric strings', () => {
    const ds = makeDataset(['mixed'], [
      { mixed: 'hello' },
      { mixed: 'world' },
      { mixed: '42' },
    ])
    const issues = analyzeDataset(ds)
    expect(issues.find((i) => i.kind === 'numeric_as_text')).toBeUndefined()
  })
})

describe('detectInconsistentCasing', () => {
  it('detects inconsistent casing variants', () => {
    const ds = makeDataset(['city'], [
      { city: 'New York' },
      { city: 'new york' },
      { city: 'NEW YORK' },
      { city: 'Chicago' },
    ])
    const issues = analyzeDataset(ds)
    const issue = issues.find((i) => i.kind === 'inconsistent_casing')
    expect(issue).toBeDefined()
    expect(issue!.affectedColumns).toContain('city')
  })

  it('does not flag a column with consistent casing', () => {
    const ds = makeDataset(['city'], [
      { city: 'Chicago' },
      { city: 'Denver' },
      { city: 'Boston' },
    ])
    const issues = analyzeDataset(ds)
    expect(issues.find((i) => i.kind === 'inconsistent_casing')).toBeUndefined()
  })
})

describe('detectOutliers', () => {
  it('flags a clear outlier using IQR method', () => {
    const ds = makeDataset(['score'], [
      { score: 20 }, { score: 22 }, { score: 21 }, { score: 23 },
      { score: 19 }, { score: 24 }, { score: 22 }, { score: 20 },
      { score: 9999 }, // clear outlier
    ])
    const issues = analyzeDataset(ds)
    const issue = issues.find((i) => i.kind === 'outliers')
    expect(issue).toBeDefined()
    expect(issue!.affectedCount).toBe(1)
    expect(issue!.affectedColumns).toContain('score')
  })

  it('does not flag [1, 2, 3, 4] as having outliers', () => {
    const ds = makeDataset(['v'], [{ v: 1 }, { v: 2 }, { v: 3 }, { v: 4 }])
    const issues = analyzeDataset(ds)
    expect(issues.find((i) => i.kind === 'outliers')).toBeUndefined()
  })

  it('flags 100 as an outlier in [1, 2, 3, 4, 100]', () => {
    const ds = makeDataset(['v'], [
      { v: 1 }, { v: 2 }, { v: 3 }, { v: 4 }, { v: 100 },
    ])
    const issues = analyzeDataset(ds)
    const issue = issues.find((i) => i.kind === 'outliers')
    expect(issue).toBeDefined()
    expect(issue!.affectedCount).toBe(1)
  })

  it('provides no available actions (outliers are flag-only)', () => {
    const ds = makeDataset(['v'], [
      { v: 1 }, { v: 2 }, { v: 3 }, { v: 4 }, { v: 100 },
    ])
    const issues = analyzeDataset(ds)
    const issue = issues.find((i) => i.kind === 'outliers')
    expect(issue!.availableActions).toHaveLength(0)
  })
})
