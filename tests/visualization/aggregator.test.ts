/**
 * aggregator.test.ts
 *
 * Tests for src/features/visualization/lib/aggregator.ts
 */
import { describe, it, expect } from 'vitest'
import { aggregate } from '../../src/features/visualization/lib/aggregator'
import type { Row } from '../../src/features/cleaning/types'

function row(group: string, value: number | null): Row {
  return { group, value }
}

const baseRows: Row[] = [
  row('A', 10), row('A', 20), row('A', 30),
  row('B', 5),  row('B', 15),
  row('C', 100),
]

describe('aggregate - sum', () => {
  it('sums values per group', () => {
    const result = aggregate(baseRows, 'group', 'value', 'sum')
    const a = result.find((r) => r.group === 'A')!
    const b = result.find((r) => r.group === 'B')!
    expect(a.value).toBe(60)
    expect(b.value).toBe(20)
  })
})

describe('aggregate - mean', () => {
  it('averages values per group', () => {
    const result = aggregate(baseRows, 'group', 'value', 'mean')
    const a = result.find((r) => r.group === 'A')!
    expect(a.value).toBeCloseTo(20, 5)
  })
})

describe('aggregate - median', () => {
  it('computes median per group', () => {
    const result = aggregate(baseRows, 'group', 'value', 'median')
    const a = result.find((r) => r.group === 'A')!
    expect(a.value).toBe(20)
  })
})

describe('aggregate - count', () => {
  it('counts non-null values per group', () => {
    const rows = [row('A', 1), row('A', null), row('A', 3)]
    const result = aggregate(rows, 'group', 'value', 'count')
    const a = result.find((r) => r.group === 'A')!
    expect(a.value).toBe(2)
  })
})

describe('aggregate - min/max', () => {
  it('computes min correctly', () => {
    const result = aggregate(baseRows, 'group', 'value', 'min')
    const a = result.find((r) => r.group === 'A')!
    expect(a.value).toBe(10)
  })

  it('computes max correctly', () => {
    const result = aggregate(baseRows, 'group', 'value', 'max')
    const a = result.find((r) => r.group === 'A')!
    expect(a.value).toBe(30)
  })
})

describe('aggregate - stddev/variance', () => {
  it('returns 0 stddev for single value group', () => {
    const rows = [row('A', 5)]
    const result = aggregate(rows, 'group', 'value', 'stddev')
    expect(result[0].value).toBe(0)
  })

  it('computes variance correctly', () => {
    const rows = [row('A', 2), row('A', 4), row('A', 4), row('A', 4), row('A', 5), row('A', 5), row('A', 7), row('A', 9)]
    const result = aggregate(rows, 'group', 'value', 'variance')
    // Known variance (sample): 4.571...
    expect(result[0].value).toBeCloseTo(4.571, 2)
  })
})

describe('aggregate - null handling', () => {
  it('skips null values in numeric aggregation', () => {
    const rows = [row('A', null), row('A', null), row('A', 10)]
    const result = aggregate(rows, 'group', 'value', 'sum')
    expect(result[0].value).toBe(10)
  })

  it('handles all-null group', () => {
    const rows = [row('A', null), row('A', null)]
    const result = aggregate(rows, 'group', 'value', 'sum')
    expect(result[0].value).toBe(0)
  })
})
