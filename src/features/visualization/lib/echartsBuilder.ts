/**
 * echartsBuilder.ts
 *
 * Converts a ChartConfig + dataset into a valid Apache ECharts option object.
 * Covers all 14 chart types. Called by ChartPreview on every config change.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyOption = Record<string, any>
type EChartsOption = AnyOption
import type { ChartConfig, ColumnMeta, TransformedDataset, ChartCustomization, NumberFormat } from '../types'
import { COLOR_PALETTES } from '../types'

export type { EChartsOption }

// ── Helpers ───────────────────────────────────────────────────────────────

function getColors(customization: ChartCustomization): string[] {
  return COLOR_PALETTES[customization.colorPalette] ?? COLOR_PALETTES.datasphere
}

function numberFormatter(format: NumberFormat) {
  return (value: number): string => {
    if (format === 'currency') return `$${value.toLocaleString()}`
    if (format === 'percentage') return `${value.toLocaleString()}%`
    if (format === 'compact') {
      if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
      if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`
    }
    return String(value)
  }
}

function buildTooltip(format: NumberFormat): EChartsOption['tooltip'] {
  const fmt = numberFormatter(format)
  return {
    trigger: 'item',
    formatter: (params: unknown) => {
      const p = params as { name?: string; seriesName?: string; value?: number | number[] | string; marker?: string }
      const marker = p.marker ?? ''
      const name = p.name ?? p.seriesName ?? ''
      const val = Array.isArray(p.value) ? p.value[1] : p.value
      return `${marker}${name}: <b>${val !== undefined && val !== null ? fmt(Number(val)) : 'N/A'}</b>`
    },
  }
}

function buildAxisTooltip(format: NumberFormat): EChartsOption['tooltip'] {
  const fmt = numberFormatter(format)
  return {
    trigger: 'axis',
    formatter: (params: unknown) => {
      const ps = params as Array<{ name?: string; seriesName?: string; value?: number | string; marker?: string; axisValue?: string }>
      if (!Array.isArray(ps) || ps.length === 0) return ''
      const axisLabel = ps[0].axisValue ?? ps[0].name ?? ''
      const lines = ps.map((p) => {
        const val = typeof p.value === 'number' ? fmt(p.value) : (p.value ?? 'N/A')
        return `${p.marker ?? ''}${p.seriesName ?? ''}: <b>${val}</b>`
      })
      return [axisLabel, ...lines].join('<br/>')
    },
  }
}

function buildLegend(customization: ChartCustomization): EChartsOption['legend'] {
  if (!customization.showLegend) return { show: false }
  const posMap: Record<string, object> = {
    top: { top: 'top' },
    bottom: { bottom: 10 },
    left: { left: 10, orient: 'vertical' },
    right: { right: 10, orient: 'vertical' },
  }
  return { show: true, type: 'scroll', ...posMap[customization.legendPosition] }
}

function buildTitle(customization: ChartCustomization): EChartsOption['title'] {
  if (!customization.title && !customization.subtitle) return undefined
  return {
    text: customization.title || undefined,
    subtext: customization.subtitle || undefined,
    left: 'center',
    textStyle: { fontSize: 14, fontWeight: 'bold' },
    subtextStyle: { fontSize: 12 },
  }
}

function buildGrid(customization: ChartCustomization): EChartsOption['grid'] {
  const hasTitle = !!(customization.title || customization.subtitle)
  return {
    top: hasTitle ? 60 : 40,
    right: 20,
    bottom: 50,
    left: 60,
    containLabel: true,
  }
}

function buildYAxis(customization: ChartCustomization, name?: string): object {
  const isLog = customization.yAxisScale === 'log'
  return {
    type: isLog ? 'log' : 'value',
    name: customization.yAxisLabel || name || undefined,
    nameLocation: 'middle',
    nameGap: 45,
    min: customization.yAxisMin ?? undefined,
    max: customization.yAxisMax ?? undefined,
    axisLabel: { formatter: numberFormatter(customization.numberFormat) },
  }
}

function buildXAxis(customization: ChartCustomization, data?: string[], name?: string): object {
  return {
    type: 'category',
    data: data,
    name: customization.xAxisLabel || name || undefined,
    nameLocation: 'middle',
    nameGap: 30,
    axisLabel: { rotate: data && data.length > 10 ? 30 : 0, overflow: 'truncate', width: 80 },
  }
}

function getSeriesColor(seriesName: string, index: number, customization: ChartCustomization): string | undefined {
  return customization.seriesColors[seriesName] ?? getColors(customization)[index % getColors(customization).length]
}

// ── Main builder ──────────────────────────────────────────────────────────

export function buildEChartsOption(
  config: ChartConfig,
  transformed: TransformedDataset,
  _columnMetas: ColumnMeta[],
  regressionLine?: { slope: number; intercept: number; rSquared: number } | null,
): EChartsOption {
  const { chartType, fieldMapping, customization } = config
  const { rows } = transformed
  const fmt = numberFormatter(customization.numberFormat)
  const colors = getColors(customization)

  const labelOption = customization.showDataLabels
    ? { show: true, formatter: (p: { value?: number }) => fmt(p.value ?? 0) }
    : { show: false }

  switch (chartType) {

    // ── Bar vertical ─────────────────────────────────────────────────────
    case 'bar-vertical': {
      const xCol = fieldMapping.xAxis!
      const yCol = fieldMapping.yAxis!
      const seriesCol = fieldMapping.series

      if (seriesCol) {
        const groups = [...new Set(rows.map((r) => String(r[seriesCol] ?? '')))]
        const categories = [...new Set(rows.map((r) => String(r[xCol] ?? '')))]
        const series = groups.map((g, i) => ({
          name: g,
          type: 'bar',
          data: categories.map((cat) => {
            const row = rows.find((r) => String(r[xCol]) === cat && String(r[seriesCol]) === g)
            return row ? Number(row[yCol]) : null
          }),
          itemStyle: { color: getSeriesColor(g, i, customization) },
          label: labelOption,
        }))
        return {
          color: colors,
          title: buildTitle(customization),
          tooltip: buildAxisTooltip(customization.numberFormat),
          legend: buildLegend(customization),
          grid: buildGrid(customization),
          xAxis: buildXAxis(customization, categories, xCol),
          yAxis: buildYAxis(customization, yCol),
          series,
        }
      }

      const data = rows.map((r) => ({ value: Number(r[yCol] ?? 0), name: String(r[xCol] ?? '') }))
      return {
        color: colors,
        title: buildTitle(customization),
        tooltip: buildAxisTooltip(customization.numberFormat),
        legend: buildLegend(customization),
        grid: buildGrid(customization),
        xAxis: buildXAxis(customization, rows.map((r) => String(r[xCol] ?? '')), xCol),
        yAxis: buildYAxis(customization, yCol),
        series: [{ type: 'bar', data: data.map((d) => d.value), itemStyle: { color: colors[0] }, label: labelOption }],
      }
    }

    // ── Bar horizontal ───────────────────────────────────────────────────
    case 'bar-horizontal': {
      const xCol = fieldMapping.xAxis!
      const yCol = fieldMapping.yAxis!
      const categories = rows.map((r) => String(r[xCol] ?? ''))
      const values = rows.map((r) => Number(r[yCol] ?? 0))
      return {
        color: colors,
        title: buildTitle(customization),
        tooltip: buildAxisTooltip(customization.numberFormat),
        legend: buildLegend(customization),
        grid: buildGrid(customization),
        xAxis: { type: 'value', name: customization.yAxisLabel || yCol, axisLabel: { formatter: fmt } },
        yAxis: { type: 'category', data: categories, name: customization.xAxisLabel || xCol },
        series: [{ type: 'bar', data: values, itemStyle: { color: colors[0] }, label: labelOption }],
      }
    }

    // ── Bar grouped ──────────────────────────────────────────────────────
    case 'bar-grouped': {
      const xCol = fieldMapping.xAxis!
      const yCol = fieldMapping.yAxis!
      const seriesCol = fieldMapping.series!
      const categories = [...new Set(rows.map((r) => String(r[xCol] ?? '')))]
      const groups = [...new Set(rows.map((r) => String(r[seriesCol] ?? '')))]
      const series = groups.map((g, i) => ({
        name: g,
        type: 'bar',
        data: categories.map((cat) => {
          const row = rows.find((r) => String(r[xCol]) === cat && String(r[seriesCol]) === g)
          return row ? Number(row[yCol]) : null
        }),
        itemStyle: { color: getSeriesColor(g, i, customization) },
        label: labelOption,
      }))
      return {
        color: colors,
        title: buildTitle(customization),
        tooltip: buildAxisTooltip(customization.numberFormat),
        legend: buildLegend(customization),
        grid: buildGrid(customization),
        xAxis: buildXAxis(customization, categories, xCol),
        yAxis: buildYAxis(customization, yCol),
        series,
      }
    }

    // ── Bar stacked ──────────────────────────────────────────────────────
    case 'bar-stacked': {
      const xCol = fieldMapping.xAxis!
      const yCol = fieldMapping.yAxis!
      const seriesCol = fieldMapping.series!
      const categories = [...new Set(rows.map((r) => String(r[xCol] ?? '')))]
      const groups = [...new Set(rows.map((r) => String(r[seriesCol] ?? '')))]
      const series = groups.map((g, i) => ({
        name: g,
        type: 'bar',
        stack: 'total',
        data: categories.map((cat) => {
          const row = rows.find((r) => String(r[xCol]) === cat && String(r[seriesCol]) === g)
          return row ? Number(row[yCol]) : null
        }),
        itemStyle: { color: getSeriesColor(g, i, customization) },
        label: labelOption,
      }))
      return {
        color: colors,
        title: buildTitle(customization),
        tooltip: buildAxisTooltip(customization.numberFormat),
        legend: buildLegend(customization),
        grid: buildGrid(customization),
        xAxis: buildXAxis(customization, categories, xCol),
        yAxis: buildYAxis(customization, yCol),
        series,
      }
    }

    // ── Line ─────────────────────────────────────────────────────────────
    case 'line': {
      const xCol = fieldMapping.xAxis!
      const yCol = fieldMapping.yAxis!
      const seriesCol = fieldMapping.series

      if (seriesCol) {
        const groups = [...new Set(rows.map((r) => String(r[seriesCol] ?? '')))]
        const categories = [...new Set(rows.map((r) => String(r[xCol] ?? '')))]
        const series = groups.map((g, i) => ({
          name: g,
          type: 'line',
          data: categories.map((cat) => {
            const row = rows.find((r) => String(r[xCol]) === cat && String(r[seriesCol]) === g)
            return row ? Number(row[yCol]) : null
          }),
          itemStyle: { color: getSeriesColor(g, i, customization) },
          label: labelOption,
        }))
        return {
          color: colors,
          title: buildTitle(customization),
          tooltip: buildAxisTooltip(customization.numberFormat),
          legend: buildLegend(customization),
          grid: buildGrid(customization),
          xAxis: buildXAxis(customization, categories, xCol),
          yAxis: buildYAxis(customization, yCol),
          series,
        }
      }

      return {
        color: colors,
        title: buildTitle(customization),
        tooltip: buildAxisTooltip(customization.numberFormat),
        legend: buildLegend(customization),
        grid: buildGrid(customization),
        xAxis: buildXAxis(customization, rows.map((r) => String(r[xCol] ?? '')), xCol),
        yAxis: buildYAxis(customization, yCol),
        series: [{ type: 'line', data: rows.map((r) => Number(r[yCol] ?? 0)), itemStyle: { color: colors[0] }, label: labelOption }],
      }
    }

    // ── Area ─────────────────────────────────────────────────────────────
    case 'area': {
      const xCol = fieldMapping.xAxis!
      const yCol = fieldMapping.yAxis!
      const seriesCol = fieldMapping.series

      if (seriesCol) {
        const groups = [...new Set(rows.map((r) => String(r[seriesCol] ?? '')))]
        const categories = [...new Set(rows.map((r) => String(r[xCol] ?? '')))]
        const series = groups.map((g, i) => ({
          name: g,
          type: 'line',
          areaStyle: {},
          data: categories.map((cat) => {
            const row = rows.find((r) => String(r[xCol]) === cat && String(r[seriesCol]) === g)
            return row ? Number(row[yCol]) : null
          }),
          itemStyle: { color: getSeriesColor(g, i, customization) },
        }))
        return {
          color: colors,
          title: buildTitle(customization),
          tooltip: buildAxisTooltip(customization.numberFormat),
          legend: buildLegend(customization),
          grid: buildGrid(customization),
          xAxis: buildXAxis(customization, categories, xCol),
          yAxis: buildYAxis(customization, yCol),
          series,
        }
      }

      return {
        color: colors,
        title: buildTitle(customization),
        tooltip: buildAxisTooltip(customization.numberFormat),
        legend: buildLegend(customization),
        grid: buildGrid(customization),
        xAxis: buildXAxis(customization, rows.map((r) => String(r[xCol] ?? '')), xCol),
        yAxis: buildYAxis(customization, yCol),
        series: [{ type: 'line', areaStyle: {}, data: rows.map((r) => Number(r[yCol] ?? 0)), itemStyle: { color: colors[0] } }],
      }
    }

    // ── Pie ──────────────────────────────────────────────────────────────
    case 'pie': {
      const catCol = fieldMapping.category!
      const valCol = fieldMapping.value!
      const data = rows.map((r) => ({ name: String(r[catCol] ?? ''), value: Number(r[valCol] ?? 0) }))
      return {
        color: colors,
        title: buildTitle(customization),
        tooltip: buildTooltip(customization.numberFormat),
        legend: buildLegend(customization),
        series: [{
          type: 'pie',
          radius: '60%',
          data,
          label: customization.showDataLabels ? { show: true, formatter: '{b}: {d}%' } : { show: false },
          emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' } },
        }],
      }
    }

    // ── Scatter ──────────────────────────────────────────────────────────
    case 'scatter': {
      const xCol = fieldMapping.xAxis!
      const yCol = fieldMapping.yAxis!
      const colorCol = fieldMapping.colorGroup

      if (colorCol) {
        const groups = [...new Set(rows.map((r) => String(r[colorCol] ?? '')))]
        const series = groups.map((g, i) => ({
          name: g,
          type: 'scatter',
          symbolSize: customization.markerSize * 2,
          data: rows
            .filter((r) => String(r[colorCol]) === g)
            .map((r) => [Number(r[xCol] ?? 0), Number(r[yCol] ?? 0)]),
          itemStyle: { color: getSeriesColor(g, i, customization) },
        }))

        const extraSeries: object[] = []
        if (regressionLine) {
          const { slope, intercept, rSquared } = regressionLine
          const xVals = rows.map((r) => Number(r[xCol] ?? 0))
          const xMin = Math.min(...xVals)
          const xMax = Math.max(...xVals)
          extraSeries.push({
            type: 'line',
            name: `Regression (R²=${rSquared.toFixed(3)})`,
            data: [[xMin, slope * xMin + intercept], [xMax, slope * xMax + intercept]],
            lineStyle: { type: 'dashed', color: '#D63939', width: 2 },
            symbol: 'none',
            tooltip: { show: false },
          })
        }

        return {
          color: colors,
          title: buildTitle(customization),
          tooltip: { trigger: 'item' },
          legend: buildLegend(customization),
          grid: buildGrid(customization),
          xAxis: { type: 'value', name: customization.xAxisLabel || xCol, nameLocation: 'middle', nameGap: 30 },
          yAxis: buildYAxis(customization, yCol),
          series: [...series, ...extraSeries],
        }
      }

      const scatterData = rows.map((r) => [Number(r[xCol] ?? 0), Number(r[yCol] ?? 0)])
      const extraSeries2: object[] = []
      if (regressionLine) {
        const { slope, intercept, rSquared } = regressionLine
        const xVals = scatterData.map((d) => d[0])
        const xMin = Math.min(...xVals)
        const xMax = Math.max(...xVals)
        extraSeries2.push({
          type: 'line',
          name: `y = ${slope.toFixed(3)}x + ${intercept.toFixed(3)} (R²=${rSquared.toFixed(3)})`,
          data: [[xMin, slope * xMin + intercept], [xMax, slope * xMax + intercept]],
          lineStyle: { type: 'dashed', color: '#D63939', width: 2 },
          symbol: 'none',
        })
      }

      return {
        color: colors,
        title: buildTitle(customization),
        tooltip: { trigger: 'item' },
        legend: buildLegend(customization),
        grid: buildGrid(customization),
        xAxis: { type: 'value', name: customization.xAxisLabel || xCol, nameLocation: 'middle', nameGap: 30 },
        yAxis: buildYAxis(customization, yCol),
        series: [
          { type: 'scatter', symbolSize: customization.markerSize * 2, data: scatterData, itemStyle: { color: colors[0] } },
          ...extraSeries2,
        ],
      }
    }

    // ── Histogram ────────────────────────────────────────────────────────
    // Data is pre-binned by echartsBuilder when called from StatisticsPanel
    case 'histogram': {
      // The histogram data is passed as pre-computed bins via transformed.rows
      // Each row has: { label: string, count: number }
      // This is populated by statsCalculator.histogramBins() in the transformer
      const labels = rows.map((r) => String(r['label'] ?? r[fieldMapping.xAxis ?? ''] ?? ''))
      const counts = rows.map((r) => Number(r['count'] ?? 0))
      return {
        color: colors,
        title: buildTitle(customization),
        tooltip: { trigger: 'axis' },
        legend: buildLegend(customization),
        grid: buildGrid(customization),
        xAxis: { type: 'category', data: labels, name: customization.xAxisLabel || fieldMapping.xAxis || 'Value', nameLocation: 'middle', nameGap: 30, axisLabel: { rotate: 30 } },
        yAxis: { type: 'value', name: customization.yAxisLabel || 'Count' },
        series: [{ type: 'bar', data: counts, barWidth: '99%', itemStyle: { color: colors[0] }, label: labelOption }],
      }
    }

    // ── Box plot ─────────────────────────────────────────────────────────
    // Data is pre-computed: rows contain { category, min, q1, median, q3, max, outliers }
    case 'box-plot': {
      const categories = rows.map((r) => String(r['category'] ?? r[fieldMapping.xAxis ?? ''] ?? ''))
      const boxData = rows.map((r) => [
        Number(r['min'] ?? 0),
        Number(r['q1'] ?? 0),
        Number(r['median'] ?? 0),
        Number(r['q3'] ?? 0),
        Number(r['max'] ?? 0),
      ])
      // Outlier points
      const outlierPoints: [number, number][] = []
      rows.forEach((r, i) => {
        const rawOutliers = r['outliers']
        if (rawOutliers && typeof rawOutliers === 'string') {
          rawOutliers.split(',').forEach((v) => {
            const n = Number(v.trim())
            if (!isNaN(n)) outlierPoints.push([i, n])
          })
        }
      })

      return {
        color: colors,
        title: buildTitle(customization),
        tooltip: { trigger: 'item' },
        legend: buildLegend(customization),
        grid: buildGrid(customization),
        xAxis: { type: 'category', data: categories, name: customization.xAxisLabel || fieldMapping.xAxis || 'Category', nameLocation: 'middle', nameGap: 30 },
        yAxis: buildYAxis(customization, fieldMapping.yAxis ?? 'Value'),
        series: [
          { type: 'boxplot', data: boxData, itemStyle: { color: colors[0] } },
          ...(outlierPoints.length > 0 ? [{
            type: 'scatter',
            name: 'Outliers',
            data: outlierPoints,
            symbolSize: 6,
            itemStyle: { color: '#D63939' },
          }] : []),
        ],
      }
    }

    // ── Correlation heatmap ──────────────────────────────────────────────
    // Data is pre-computed: rows contain { col1, col2, r }
    case 'heatmap-correlation': {
      const colNames = [...new Set(rows.map((r) => String(r['col1'] ?? '')))]
      const colNames2 = [...new Set(rows.map((r) => String(r['col2'] ?? '')))]
      const allCols = [...new Set([...colNames, ...colNames2])]
      const heatData = rows.map((r) => [
        allCols.indexOf(String(r['col1'])),
        allCols.indexOf(String(r['col2'])),
        r['r'] !== null ? Number((Number(r['r'])).toFixed(3)) : null,
      ])

      return {
        color: colors,
        title: buildTitle(customization),
        tooltip: {
          position: 'top',
          formatter: (p: unknown) => {
            const param = p as { data?: [number, number, number | null] }
            if (!param.data) return ''
            const val = param.data[2]
            const c1 = allCols[param.data[0]] ?? ''
            const c2 = allCols[param.data[1]] ?? ''
            return `${c1} × ${c2}: <b>${val !== null ? val.toFixed(3) : 'N/A'}</b>`
          },
        },
        grid: { ...buildGrid(customization), bottom: 80 },
        xAxis: { type: 'category', data: allCols, splitArea: { show: true } },
        yAxis: { type: 'category', data: allCols, splitArea: { show: true } },
        visualMap: {
          min: -1,
          max: 1,
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: 10,
          inRange: { color: ['#D63939', '#FFFFFF', '#3B5BDB'] },
        },
        series: [{
          type: 'heatmap',
          data: heatData,
          label: { show: allCols.length <= 8 },
          emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } },
        }],
      }
    }

    // ── Combo bar + line ──────────────────────────────────────────────────
    case 'combo-bar-line': {
      const xCol = fieldMapping.xAxis!
      const barCol = fieldMapping.barSeries!
      const lineCol = fieldMapping.lineSeries!
      const categories = rows.map((r) => String(r[xCol] ?? ''))
      return {
        color: colors,
        title: buildTitle(customization),
        tooltip: buildAxisTooltip(customization.numberFormat),
        legend: buildLegend(customization),
        grid: buildGrid(customization),
        xAxis: buildXAxis(customization, categories, xCol),
        yAxis: [
          { type: 'value', name: customization.yAxisLabel || barCol, axisLabel: { formatter: fmt } },
          { type: 'value', name: lineCol, axisLabel: { formatter: fmt } },
        ],
        series: [
          { type: 'bar', name: barCol, data: rows.map((r) => Number(r[barCol] ?? 0)), yAxisIndex: 0, itemStyle: { color: colors[0] }, label: labelOption },
          { type: 'line', name: lineCol, data: rows.map((r) => Number(r[lineCol] ?? 0)), yAxisIndex: 1, itemStyle: { color: colors[1] ?? colors[0] } },
        ],
      }
    }

    // ── Multi-series line ─────────────────────────────────────────────────
    case 'line-multi-series': {
      const xCol = fieldMapping.xAxis!
      const measures = fieldMapping.measures ?? []
      const categories = rows.map((r) => String(r[xCol] ?? ''))
      const series = measures.map((m, i) => ({
        type: 'line',
        name: m,
        data: rows.map((r) => Number(r[m] ?? 0)),
        itemStyle: { color: getSeriesColor(m, i, customization) },
        label: labelOption,
      }))
      return {
        color: colors,
        title: buildTitle(customization),
        tooltip: buildAxisTooltip(customization.numberFormat),
        legend: buildLegend(customization),
        grid: buildGrid(customization),
        xAxis: buildXAxis(customization, categories, xCol),
        yAxis: buildYAxis(customization),
        series,
      }
    }

    // ── Faceted ───────────────────────────────────────────────────────────
    case 'faceted': {
      const xCol = fieldMapping.xAxis!
      const yCol = fieldMapping.yAxis!
      const facetCol = fieldMapping.facetBy!
      const facetValues = [...new Set(rows.map((r) => String(r[facetCol] ?? '')))].slice(0, 12)
      const panelCount = facetValues.length
      const cols = Math.min(3, panelCount)
      const rowCount = Math.ceil(panelCount / cols)

      const gridArr = facetValues.map((_, idx) => ({
        left: `${(idx % cols) * (100 / cols) + 2}%`,
        top: `${Math.floor(idx / cols) * (100 / rowCount) + 8}%`,
        width: `${100 / cols - 4}%`,
        height: `${100 / rowCount - 12}%`,
        containLabel: false,
      }))

      const xAxes = facetValues.map((fv, idx) => ({
        gridIndex: idx,
        type: 'category',
        data: rows.filter((r) => String(r[facetCol]) === fv).map((r) => String(r[xCol] ?? '')),
        axisLabel: { show: idx >= (rowCount - 1) * cols },
      }))

      const yAxes = facetValues.map((_, idx) => ({
        gridIndex: idx,
        type: 'value',
        axisLabel: { show: idx % cols === 0 },
      }))

      const series = facetValues.map((fv, idx) => ({
        type: 'bar',
        name: fv,
        xAxisIndex: idx,
        yAxisIndex: idx,
        data: rows.filter((r) => String(r[facetCol]) === fv).map((r) => Number(r[yCol] ?? 0)),
        itemStyle: { color: getSeriesColor(fv, idx, customization) },
        label: { show: false },
      }))

      const titleGraphics = facetValues.map((fv, idx) => ({
        type: 'text',
        style: {
          text: fv,
          fontSize: 11,
          fontWeight: 'bold',
          fill: '#475569',
        },
        left: `${(idx % cols) * (100 / cols) + 100 / cols / 2}%`,
        top: `${Math.floor(idx / cols) * (100 / rowCount) + 2}%`,
        z: 100,
      }))

      return {
        color: colors,
        title: buildTitle(customization),
        tooltip: { trigger: 'item' },
        grid: gridArr,
        xAxis: xAxes,
        yAxis: yAxes,
        series,
        graphic: titleGraphics,
      }
    }

    default:
      return {}
  }
}
