/**
 * transformer.test.ts
 *
 * Tests for src/features/visualization/lib/transformer.ts
 */
import { describe, it, expect } from 'vitest'
import { transformDataset, transformWithAggregation } from '../../src/features/visualization/lib/transformer'
import type { ParsedDataset } from '../../src/features/cleaning/types'
import type { TransformConfig } from '../../src/features/visualization/types'

function makeDs(columns: string[], rows: Record<string, unknown>[]): ParsedDataset {
  return { fileName: 'test.csv', columns, rows: rows as ParsedDataset['rows'] }
}

function makeConfig(overrides: Partial<TransformConfig> = {}): TransformConfig {
  return {
    filters: [],
    sortRules: [],
    aggregation: { method: 'none' },
    excludeMissingValues: false,
    binCount: 20,
    ...overrides,
  }
}

const sampleDs = makeDs(['name', 'score', 'city'], [
  { name: 'Alice', score: 90, city: 'NYC' },
  { name: 'Bob', score: 70, city: 'LA' },
  { name: 'Carol', score: 85, city: 'NYC' },
  { name: 'Dave', score: 60, city: 'LA' },
  { name: 'Eve', score: 95, city: 'NYC' },
])

describe('transformDataset - filters', () => {
  it('filters with eq operator', () => {
    const result = transformDataset(sampleDs, makeConfig({
      filters: [{ id: '1', column: 'city', operator: 'eq', value: 'NYC' }],
    }))
    expect(result.rows.every((r) => r.city === 'NYC')).toBe(true)
    expect(result.rows.length).toBe(3)
    expect(result.excludedRowCount).toBe(2)
  })

  it('filters with neq operator', () => {
    const result = transformDataset(sampleDs, makeConfig({
      filters: [{ id: '1', column: 'city', operator: 'neq', value: 'NYC' }],
    }))
    expect(result.rows.length).toBe(2)
  })

  it('filters with gt operator', () => {
    const result = transformDataset(sampleDs, makeConfig({
      filters: [{ id: '1', column: 'score', operator: 'gt', value: '80' }],
    }))
    expect(result.rows.length).toBe(3) // 90, 85, 95
  })

  it('filters with lt operator', () => {
    const result = transformDataset(sampleDs, makeConfig({
      filters: [{ id: '1', column: 'score', operator: 'lt', value: '80' }],
    }))
    expect(result.rows.length).toBe(2) // 70, 60
  })

  it('filters with contains operator (case-insensitive)', () => {
    const result = transformDataset(sampleDs, makeConfig({
      filters: [{ id: '1', column: 'name', operator: 'contains', value: 'a' }],
    }))
    // 'a' in name (lowercased): Alice→alice✓, Bob→bob✗, Carol→carol✓, Dave→dave✓, Eve→eve✗
    expect(result.rows.length).toBe(3)
    const names = result.rows.map((r) => r.name)
    expect(names).toContain('Alice')
    expect(names).toContain('Carol')
    expect(names).toContain('Dave')
  })

  it('filters with not_contains operator (case-insensitive)', () => {
    const result = transformDataset(sampleDs, makeConfig({
      filters: [{ id: '1', column: 'name', operator: 'not_contains', value: 'a' }],
    }))
    // Does NOT contain 'a': Bob, Eve
    expect(result.rows.length).toBe(2)
    const names = result.rows.map((r) => r.name)
    expect(names).toContain('Bob')
    expect(names).toContain('Eve')
  })

  it('skips filters with empty value', () => {
    const result = transformDataset(sampleDs, makeConfig({
      filters: [{ id: '1', column: 'city', operator: 'eq', value: '' }],
    }))
    expect(result.rows.length).toBe(5)
  })
})

describe('transformDataset - sort', () => {
  it('sorts ascending', () => {
    const result = transformDataset(sampleDs, makeConfig({
      sortRules: [{ column: 'score', direction: 'asc' }],
    }))
    const scores = result.rows.map((r) => r.score as number)
    expect(scores).toEqual([60, 70, 85, 90, 95])
  })

  it('sorts descending', () => {
    const result = transformDataset(sampleDs, makeConfig({
      sortRules: [{ column: 'score', direction: 'desc' }],
    }))
    const scores = result.rows.map((r) => r.score as number)
    expect(scores).toEqual([95, 90, 85, 70, 60])
  })
})

describe('transformDataset - excludeMissingValues', () => {
  it('excludes rows with any missing value', () => {
    const ds = makeDs(['a', 'b'], [
      { a: 1, b: 2 },
      { a: null, b: 3 },
      { a: 4, b: null },
      { a: 5, b: 6 },
    ])
    const result = transformDataset(ds, makeConfig({ excludeMissingValues: true }))
    expect(result.rows.length).toBe(2)
    expect(result.excludedRowCount).toBe(2)
  })
})

describe('transformDataset - date range filter', () => {
  it('filters rows outside date range', () => {
    const ds = makeDs(['date', 'value'], [
      { date: '2024-01-01', value: 1 },
      { date: '2024-03-15', value: 2 },
      { date: '2024-06-01', value: 3 },
      { date: '2024-12-31', value: 4 },
    ])
    const result = transformDataset(ds, makeConfig({
      dateRange: { column: 'date', start: '2024-02-01', end: '2024-07-01' },
    }))
    expect(result.rows.length).toBe(2) // March and June
    expect(result.excludedRowCount).toBe(2)
  })
})

describe('transformWithAggregation', () => {
  it('aggregates by group and value column', () => {
    const result = transformWithAggregation(
      sampleDs,
      makeConfig({ aggregation: { method: 'mean', groupByColumn: 'city' } }),
      'city',
      'score',
    )
    const nyc = result.rows.find((r) => r.city === 'NYC')!
    // Alice=90, Carol=85, Eve=95 → mean=90
    expect(nyc.score).toBeCloseTo(90, 5)
    expect(result.wasAggregated).toBe(true)
  })
})
