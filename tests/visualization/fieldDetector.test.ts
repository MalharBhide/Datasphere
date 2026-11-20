/**
 * fieldDetector.test.ts
 *
 * Tests for src/features/visualization/lib/fieldDetector.ts
 */
import { describe, it, expect } from 'vitest'
import { detectColumnTypes } from '../../src/features/visualization/lib/fieldDetector'
import type { ParsedDataset } from '../../src/features/cleaning/types'

function makeDataset(columns: string[], rows: Record<string, unknown>[]): ParsedDataset {
  return { fileName: 'test.csv', columns, rows: rows as ParsedDataset['rows'] }
}

describe('detectColumnTypes', () => {
  it('classifies a numeric column correctly', () => {
    const ds = makeDataset(['value'], [
      { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }, { value: 5 },
    ])
    const metas = detectColumnTypes(ds)
    expect(metas[0].type).toBe('numeric')
  })

  it('classifies a string-numeric column as numeric when >80% are numbers', () => {
    const ds = makeDataset(['score'], [
      { score: '90' }, { score: '85' }, { score: '72' }, { score: '95' }, { score: '88' },
    ])
    const metas = detectColumnTypes(ds)
    expect(metas[0].type).toBe('numeric')
  })

  it('classifies a categorical column correctly', () => {
    const ds = makeDataset(['city'], [
      { city: 'London' }, { city: 'Paris' }, { city: 'Berlin' }, { city: 'Rome' },
    ])
    const metas = detectColumnTypes(ds)
    expect(metas[0].type).toBe('categorical')
  })

  it('classifies an ISO date column as date', () => {
    const ds = makeDataset(['date'], [
      { date: '2024-01-01' }, { date: '2024-02-15' }, { date: '2024-03-10' },
      { date: '2024-04-20' }, { date: '2024-05-05' },
    ])
    const metas = detectColumnTypes(ds)
    expect(metas[0].type).toBe('date')
  })

  it('classifies a boolean column correctly', () => {
    const ds = makeDataset(['active'], [
      { active: 'true' }, { active: 'false' }, { active: 'true' }, { active: 'false' },
    ])
    const metas = detectColumnTypes(ds)
    expect(metas[0].type).toBe('boolean')
  })

  it('handles all-null column as categorical', () => {
    const ds = makeDataset(['empty'], [
      { empty: null }, { empty: null }, { empty: null },
    ])
    const metas = detectColumnTypes(ds)
    expect(metas[0].type).toBe('categorical')
    expect(metas[0].nonNullCount).toBe(0)
  })

  it('classifies mixed numeric/string as categorical when <80% are numeric', () => {
    const ds = makeDataset(['mixed'], [
      { mixed: 'alpha' }, { mixed: 'beta' }, { mixed: 1 }, { mixed: 2 }, { mixed: 'gamma' },
    ])
    const metas = detectColumnTypes(ds)
    expect(metas[0].type).toBe('categorical')
  })

  it('reports correct nonNullCount', () => {
    const ds = makeDataset(['v'], [
      { v: 1 }, { v: null }, { v: 2 }, { v: null }, { v: 3 },
    ])
    const metas = detectColumnTypes(ds)
    expect(metas[0].nonNullCount).toBe(3)
    expect(metas[0].totalCount).toBe(5)
  })

  it('caps uniqueValues at 100', () => {
    const rows = Array.from({ length: 200 }, (_, i) => ({ v: i }))
    const ds = makeDataset(['v'], rows)
    const metas = detectColumnTypes(ds)
    expect(metas[0].uniqueValues.length).toBeLessThanOrEqual(100)
  })
})
