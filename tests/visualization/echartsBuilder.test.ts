/**
 * echartsBuilder.test.ts
 *
 * Tests for src/features/visualization/lib/echartsBuilder.ts
 * Verifies ECharts option structure for all 14 chart types.
 * Does NOT render anything — just validates the returned option object.
 */
import { describe, it, expect } from 'vitest'
import { buildEChartsOption } from '../../src/features/visualization/lib/echartsBuilder'
import type { ChartConfig, ColumnMeta, TransformedDataset } from '../../src/features/visualization/types'
import { defaultChartConfig } from '../../src/features/visualization/types'

function makeColumnMeta(name: string, type: ColumnMeta['type']): ColumnMeta {
  return { name, type, nonNullCount: 5, totalCount: 5, uniqueValues: [] }
}

const metas: ColumnMeta[] = [
  makeColumnMeta('x', 'numeric'),
  makeColumnMeta('y', 'numeric'),
  makeColumnMeta('cat', 'categorical'),
  makeColumnMeta('grp', 'categorical'),
]

function makeTransformed(columns: string[], rows: Record<string, unknown>[]): TransformedDataset {
  return { columns, rows: rows as TransformedDataset['rows'], excludedRowCount: 0, excludedReasons: [], wasAggregated: false }
}

const catData = makeTransformed(['cat', 'x', 'y', 'grp'], [
  { cat: 'A', x: 1, y: 10, grp: 'G1' },
  { cat: 'B', x: 2, y: 20, grp: 'G1' },
  { cat: 'C', x: 3, y: 30, grp: 'G2' },
])

function cfg(chartType: ChartConfig['chartType'], overrides: Partial<ChartConfig['fieldMapping']> = {}): ChartConfig {
  return { ...defaultChartConfig(chartType), fieldMapping: overrides }
}

describe('echartsBuilder - bar-vertical', () => {
  it('returns a bar series', () => {
    const opt = buildEChartsOption(cfg('bar-vertical', { xAxis: 'cat', yAxis: 'x' }), catData, metas)
    const series = opt.series as unknown[]
    expect(series.length).toBeGreaterThan(0)
    expect((series[0] as { type: string }).type).toBe('bar')
  })
})

describe('echartsBuilder - bar-horizontal', () => {
  it('returns a bar series with swapped axes', () => {
    const opt = buildEChartsOption(cfg('bar-horizontal', { xAxis: 'cat', yAxis: 'x' }), catData, metas)
    const series = opt.series as unknown[]
    expect((series[0] as { type: string }).type).toBe('bar')
    // yAxis should be category type
    expect((opt.yAxis as { type?: string }).type).toBe('category')
  })
})

describe('echartsBuilder - bar-grouped', () => {
  it('creates one series per group', () => {
    const opt = buildEChartsOption(cfg('bar-grouped', { xAxis: 'cat', yAxis: 'x', series: 'grp' }), catData, metas)
    const series = opt.series as unknown[]
    // 2 unique groups: G1, G2
    expect(series.length).toBe(2)
  })
})

describe('echartsBuilder - bar-stacked', () => {
  it('creates stacked bar series', () => {
    const opt = buildEChartsOption(cfg('bar-stacked', { xAxis: 'cat', yAxis: 'x', series: 'grp' }), catData, metas)
    const series = opt.series as unknown[]
    expect((series[0] as { stack?: string }).stack).toBe('total')
  })
})

describe('echartsBuilder - line', () => {
  it('returns a line series', () => {
    const opt = buildEChartsOption(cfg('line', { xAxis: 'cat', yAxis: 'x' }), catData, metas)
    const series = opt.series as unknown[]
    expect((series[0] as { type: string }).type).toBe('line')
  })
})

describe('echartsBuilder - area', () => {
  it('returns a line series with areaStyle', () => {
    const opt = buildEChartsOption(cfg('area', { xAxis: 'cat', yAxis: 'x' }), catData, metas)
    const series = opt.series as unknown[]
    expect((series[0] as { type: string; areaStyle: object }).areaStyle).toBeDefined()
  })
})

describe('echartsBuilder - pie', () => {
  it('returns a pie series', () => {
    const opt = buildEChartsOption(cfg('pie', { category: 'cat', value: 'x' }), catData, metas)
    const series = opt.series as unknown[]
    expect((series[0] as { type: string }).type).toBe('pie')
  })

  it('pie data has name + value', () => {
    const opt = buildEChartsOption(cfg('pie', { category: 'cat', value: 'x' }), catData, metas)
    const series = opt.series as unknown[]
    const data = (series[0] as { data: { name: string; value: number }[] }).data
    expect(data[0]).toHaveProperty('name')
    expect(data[0]).toHaveProperty('value')
  })
})

describe('echartsBuilder - scatter', () => {
  it('returns a scatter series', () => {
    const opt = buildEChartsOption(cfg('scatter', { xAxis: 'x', yAxis: 'y' }), catData, metas)
    const series = opt.series as unknown[]
    expect((series[0] as { type: string }).type).toBe('scatter')
  })
})

describe('echartsBuilder - scatter with regression', () => {
  it('adds a line series for regression', () => {
    const regression = { slope: 1, intercept: 0, rSquared: 0.99 }
    const opt = buildEChartsOption(cfg('scatter', { xAxis: 'x', yAxis: 'y' }), catData, metas, regression)
    const series = opt.series as unknown[]
    const lineSeriesArr = series.filter((s) => (s as { type: string }).type === 'line')
    expect(lineSeriesArr.length).toBeGreaterThan(0)
  })
})

describe('echartsBuilder - histogram', () => {
  const histData = makeTransformed(['label', 'count'], [
    { label: '0–10', count: 5 },
    { label: '10–20', count: 8 },
    { label: '20–30', count: 3 },
  ])

  it('returns a bar series', () => {
    const opt = buildEChartsOption(cfg('histogram', { xAxis: 'x' }), histData, metas)
    const series = opt.series as unknown[]
    expect((series[0] as { type: string }).type).toBe('bar')
  })
})

describe('echartsBuilder - box-plot', () => {
  const boxData = makeTransformed(['category', 'min', 'q1', 'median', 'q3', 'max', 'outliers'], [
    { category: 'A', min: 1, q1: 3, median: 5, q3: 7, max: 9, outliers: '' },
    { category: 'B', min: 2, q1: 4, median: 6, q3: 8, max: 10, outliers: '20' },
  ])

  it('returns a boxplot series', () => {
    const opt = buildEChartsOption(cfg('box-plot', { yAxis: 'y' }), boxData, metas)
    const series = opt.series as unknown[]
    const bp = series.find((s) => (s as { type: string }).type === 'boxplot')
    expect(bp).toBeDefined()
  })
})

describe('echartsBuilder - heatmap-correlation', () => {
  const heatData = makeTransformed(['col1', 'col2', 'r'], [
    { col1: 'x', col2: 'x', r: 1 },
    { col1: 'x', col2: 'y', r: 0.8 },
    { col1: 'y', col2: 'x', r: 0.8 },
    { col1: 'y', col2: 'y', r: 1 },
  ])

  it('returns a heatmap series', () => {
    const opt = buildEChartsOption(cfg('heatmap-correlation', { measures: ['x', 'y'] }), heatData, metas)
    const series = opt.series as unknown[]
    expect((series[0] as { type: string }).type).toBe('heatmap')
  })

  it('includes visualMap', () => {
    const opt = buildEChartsOption(cfg('heatmap-correlation', {}), heatData, metas)
    expect(opt.visualMap).toBeDefined()
  })
})

describe('echartsBuilder - combo-bar-line', () => {
  it('returns one bar and one line series', () => {
    const opt = buildEChartsOption(cfg('combo-bar-line', { xAxis: 'cat', barSeries: 'x', lineSeries: 'y' }), catData, metas)
    const series = opt.series as unknown[]
    expect(series.some((s) => (s as { type: string }).type === 'bar')).toBe(true)
    expect(series.some((s) => (s as { type: string }).type === 'line')).toBe(true)
  })
})

describe('echartsBuilder - line-multi-series', () => {
  it('returns one line series per measure', () => {
    const opt = buildEChartsOption(cfg('line-multi-series', { xAxis: 'cat', measures: ['x', 'y'] }), catData, metas)
    const series = opt.series as unknown[]
    expect(series.length).toBe(2)
    expect(series.every((s) => (s as { type: string }).type === 'line')).toBe(true)
  })
})

describe('echartsBuilder - faceted', () => {
  it('creates one series per facet category', () => {
    const opt = buildEChartsOption(cfg('faceted', { xAxis: 'cat', yAxis: 'x', facetBy: 'grp' }), catData, metas)
    const series = opt.series as unknown[]
    // 2 facet values: G1, G2
    expect(series.length).toBe(2)
  })

  it('creates one grid per facet', () => {
    const opt = buildEChartsOption(cfg('faceted', { xAxis: 'cat', yAxis: 'x', facetBy: 'grp' }), catData, metas)
    const grid = opt.grid as unknown[]
    expect(grid.length).toBe(2)
  })
})

describe('echartsBuilder - color palette', () => {
  it('uses the configured color palette', () => {
    const config = { ...defaultChartConfig('bar-vertical'), fieldMapping: { xAxis: 'cat', yAxis: 'x' } }
    config.customization.colorPalette = 'emerald'
    const opt = buildEChartsOption(config, catData, metas)
    expect(opt.color).toBeDefined()
  })
})
