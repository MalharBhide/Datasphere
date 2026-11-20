/**
 * chartConfigValidator.test.ts
 *
 * Tests for src/features/visualization/lib/chartConfigValidator.ts
 */
import { describe, it, expect } from 'vitest'
import { validateChartConfig } from '../../src/features/visualization/lib/chartConfigValidator'
import type { ChartConfig, ColumnMeta } from '../../src/features/visualization/types'
import { defaultChartConfig, defaultCustomization, defaultTransformConfig } from '../../src/features/visualization/types'

function makeColumnMeta(name: string, type: ColumnMeta['type']): ColumnMeta {
  return { name, type, nonNullCount: 10, totalCount: 10, uniqueValues: [] }
}

const numericMetas: ColumnMeta[] = [
  makeColumnMeta('x', 'numeric'),
  makeColumnMeta('y', 'numeric'),
  makeColumnMeta('category', 'categorical'),
]

function makeConfig(chartType: ChartConfig['chartType'], overrides: Partial<ChartConfig['fieldMapping']> = {}): ChartConfig {
  return {
    ...defaultChartConfig(chartType),
    fieldMapping: overrides,
  }
}

// ── Bar vertical ──────────────────────────────────────────────────────────

describe('validateChartConfig - bar-vertical', () => {
  it('passes with valid mapping', () => {
    const result = validateChartConfig(
      makeConfig('bar-vertical', { xAxis: 'category', yAxis: 'x' }),
      numericMetas,
    )
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('fails when xAxis is missing', () => {
    const result = validateChartConfig(
      makeConfig('bar-vertical', { yAxis: 'x' }),
      numericMetas,
    )
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('X Axis'))).toBe(true)
  })

  it('fails when yAxis is missing', () => {
    const result = validateChartConfig(
      makeConfig('bar-vertical', { xAxis: 'category' }),
      numericMetas,
    )
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('Y Axis'))).toBe(true)
  })

  it('fails when column does not exist', () => {
    const result = validateChartConfig(
      makeConfig('bar-vertical', { xAxis: 'nonexistent', yAxis: 'x' }),
      numericMetas,
    )
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('nonexistent'))).toBe(true)
  })

  it('fails when yAxis is not numeric', () => {
    const result = validateChartConfig(
      makeConfig('bar-vertical', { xAxis: 'category', yAxis: 'category' }),
      numericMetas,
    )
    expect(result.valid).toBe(false)
  })
})

// ── Scatter ───────────────────────────────────────────────────────────────

describe('validateChartConfig - scatter', () => {
  it('requires numeric X and Y', () => {
    // Using 'category' (categorical) as X should fail
    const result = validateChartConfig(
      makeConfig('scatter', { xAxis: 'category', yAxis: 'y' }),
      numericMetas,
    )
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('X Axis'))).toBe(true)
  })

  it('passes with numeric X and Y', () => {
    const result = validateChartConfig(
      makeConfig('scatter', { xAxis: 'x', yAxis: 'y' }),
      numericMetas,
    )
    expect(result.valid).toBe(true)
  })
})

// ── Pie ───────────────────────────────────────────────────────────────────

describe('validateChartConfig - pie', () => {
  it('passes with category and value', () => {
    const result = validateChartConfig(
      makeConfig('pie', { category: 'category', value: 'x' }),
      numericMetas,
    )
    expect(result.valid).toBe(true)
  })

  it('fails when category is missing', () => {
    const result = validateChartConfig(
      makeConfig('pie', { value: 'x' }),
      numericMetas,
    )
    expect(result.valid).toBe(false)
  })
})

// ── Histogram ─────────────────────────────────────────────────────────────

describe('validateChartConfig - histogram', () => {
  it('requires a numeric xAxis', () => {
    const result = validateChartConfig(
      makeConfig('histogram', { xAxis: 'x' }),
      numericMetas,
    )
    expect(result.valid).toBe(true)
  })

  it('fails when xAxis is missing', () => {
    const result = validateChartConfig(
      makeConfig('histogram', {}),
      numericMetas,
    )
    expect(result.valid).toBe(false)
  })
})

// ── Heatmap correlation ───────────────────────────────────────────────────

describe('validateChartConfig - heatmap-correlation', () => {
  it('requires at least 2 numeric measures when specified', () => {
    const result = validateChartConfig(
      makeConfig('heatmap-correlation', { measures: ['x'] }),
      numericMetas,
    )
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('2 numeric'))).toBe(true)
  })

  it('passes when 2+ numeric measures specified', () => {
    const result = validateChartConfig(
      makeConfig('heatmap-correlation', { measures: ['x', 'y'] }),
      numericMetas,
    )
    expect(result.valid).toBe(true)
  })

  it('passes with no measures when multiple numeric columns exist', () => {
    // With no measures specified, heatmap-correlation has no required roles
    // so it should pass (the builder uses all numeric columns)
    const result = validateChartConfig(
      makeConfig('heatmap-correlation', {}),
      numericMetas,
    )
    // No required roles for heatmap-correlation → valid
    expect(result.valid).toBe(true)
  })
})

// ── Combo bar-line ────────────────────────────────────────────────────────

describe('validateChartConfig - combo-bar-line', () => {
  it('requires xAxis, barSeries, lineSeries', () => {
    const result = validateChartConfig(
      makeConfig('combo-bar-line', { xAxis: 'category', barSeries: 'x', lineSeries: 'y' }),
      numericMetas,
    )
    expect(result.valid).toBe(true)
  })

  it('fails when lineSeries is missing', () => {
    const result = validateChartConfig(
      makeConfig('combo-bar-line', { xAxis: 'category', barSeries: 'x' }),
      numericMetas,
    )
    expect(result.valid).toBe(false)
  })
})

// ── Multi-series line ─────────────────────────────────────────────────────

describe('validateChartConfig - line-multi-series', () => {
  it('requires xAxis and at least one measure', () => {
    const result = validateChartConfig(
      makeConfig('line-multi-series', { xAxis: 'category', measures: ['x', 'y'] }),
      numericMetas,
    )
    expect(result.valid).toBe(true)
  })

  it('fails when measures are empty', () => {
    const result = validateChartConfig(
      makeConfig('line-multi-series', { xAxis: 'category', measures: [] }),
      numericMetas,
    )
    expect(result.valid).toBe(false)
  })
})

// ── Log scale warning ─────────────────────────────────────────────────────

describe('validateChartConfig - log scale warning', () => {
  it('adds a warning when log scale is set', () => {
    const config = {
      ...defaultChartConfig('bar-vertical'),
      fieldMapping: { xAxis: 'category', yAxis: 'x' },
      customization: { ...defaultCustomization(), yAxisScale: 'log' as const },
    }
    const result = validateChartConfig(config, numericMetas)
    expect(result.warnings.some((w) => w.includes('Logarithmic'))).toBe(true)
  })
})

// ── Custom transform config ───────────────────────────────────────────────

describe('validateChartConfig - no chart type', () => {
  it('returns invalid for missing chart type', () => {
    // Build a config with a deliberately wrong chart type
    const config: ChartConfig = {
      chartType: '' as ChartConfig['chartType'],
      fieldMapping: {},
      transform: defaultTransformConfig(),
      customization: defaultCustomization(),
      showRegressionLine: false,
    }
    const result = validateChartConfig(config, numericMetas)
    expect(result.valid).toBe(false)
  })
})
