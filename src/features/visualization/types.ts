/**
 * Datasphere — Visualization Feature Types
 *
 * All serializable types for the visualization wizard.
 * No functions in state — everything here can be JSON-serialized.
 */
import type { ParsedDataset, Row } from '../cleaning/types'

// Re-export for convenience within the feature
export type { ParsedDataset, Row }

// ── Field / column types ──────────────────────────────────────────────────

export type FieldType = 'numeric' | 'categorical' | 'date' | 'boolean'

export interface ColumnMeta {
  name: string
  type: FieldType
  /** Number of non-null values */
  nonNullCount: number
  /** Total row count */
  totalCount: number
  /** Unique non-null values (capped at 100 for perf) */
  uniqueValues: (string | number)[]
}

// ── Chart types ───────────────────────────────────────────────────────────

export type ChartType =
  | 'bar-vertical'
  | 'bar-horizontal'
  | 'bar-grouped'
  | 'bar-stacked'
  | 'line'
  | 'area'
  | 'pie'
  | 'scatter'
  | 'histogram'
  | 'box-plot'
  | 'heatmap-correlation'
  | 'combo-bar-line'
  | 'line-multi-series'
  | 'faceted'

export type FieldRole =
  | 'xAxis'
  | 'yAxis'
  | 'category'
  | 'value'
  | 'series'
  | 'colorGroup'
  | 'measures'
  | 'barSeries'
  | 'lineSeries'
  | 'facetBy'

export interface ChartRegistryEntry {
  chartType: ChartType
  displayName: string
  description: string
  category: 'standard' | 'statistical' | 'advanced'
  requiredRoles: FieldRole[]
  optionalRoles: FieldRole[]
  /** Allowed FieldTypes per role (empty = any type allowed) */
  roleTypeConstraints: Partial<Record<FieldRole, FieldType[]>>
  /** Whether this chart type shows the inline StatisticsPanel */
  showsStatisticsPanel: boolean
}

// ── Field mapping ─────────────────────────────────────────────────────────

export interface FieldMapping {
  xAxis?: string
  yAxis?: string
  category?: string
  value?: string
  series?: string
  colorGroup?: string
  /** For multi-series line: multiple numeric columns */
  measures?: string[]
  barSeries?: string
  lineSeries?: string
  facetBy?: string
}

// ── Aggregation ───────────────────────────────────────────────────────────

export type AggregationMethod =
  | 'none'
  | 'sum'
  | 'mean'
  | 'median'
  | 'count'
  | 'min'
  | 'max'
  | 'stddev'
  | 'variance'

export interface AggregationConfig {
  method: AggregationMethod
  groupByColumn?: string
}

// ── Filtering & sorting ───────────────────────────────────────────────────

export type FilterOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'not_contains'

export interface FilterRule {
  id: string
  column: string
  operator: FilterOperator
  value: string
}

export type SortDirection = 'asc' | 'desc'

export interface SortRule {
  column: string
  direction: SortDirection
}

export interface DateRangeFilter {
  column: string
  start: string
  end: string
}

// ── Transform config (serializable) ─────────────────────────────────────

export interface TransformConfig {
  filters: FilterRule[]
  sortRules: SortRule[]
  aggregation: AggregationConfig
  dateRange?: DateRangeFilter
  excludeMissingValues: boolean
  /** For histograms */
  binCount: number
}

// ── Chart customization ──────────────────────────────────────────────────

export type NumberFormat = 'plain' | 'currency' | 'percentage' | 'compact'
export type AxisScaleType = 'linear' | 'log'
export type LegendPosition = 'top' | 'bottom' | 'left' | 'right'

export type ColorPaletteName =
  | 'datasphere'
  | 'emerald'
  | 'warm'
  | 'cool'
  | 'monochrome'

export interface ChartCustomization {
  title: string
  subtitle: string
  xAxisLabel: string
  yAxisLabel: string
  showDataLabels: boolean
  showLegend: boolean
  legendPosition: LegendPosition
  colorPalette: ColorPaletteName
  /** Per-series color overrides keyed by series name */
  seriesColors: Record<string, string>
  markerSize: number
  xAxisMin?: number
  xAxisMax?: number
  yAxisMin?: number
  yAxisMax?: number
  numberFormat: NumberFormat
  dateFormat: string
  yAxisScale: AxisScaleType
  /** Scatter-only: show linear regression trendline */
  showRegressionLine: boolean
}

// ── Full chart config ────────────────────────────────────────────────────

export interface ChartConfig {
  chartType: ChartType
  fieldMapping: FieldMapping
  transform: TransformConfig
  customization: ChartCustomization
  showRegressionLine: boolean
}

// ── Validation ───────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// ── Transformed dataset (output of transformer.ts) ───────────────────────

export interface TransformedDataset {
  columns: string[]
  rows: Row[]
  excludedRowCount: number
  excludedReasons: string[]
  /** True when group-by aggregation was applied */
  wasAggregated: boolean
}

// ── Stats types ───────────────────────────────────────────────────────────

export interface DescriptiveStats {
  count: number
  missingCount: number
  mean: number
  median: number
  mode: number[]
  min: number
  max: number
  range: number
  variance: number
  stddev: number
  q1: number
  q3: number
  iqr: number
  p5: number
  p25: number
  p75: number
  p95: number
}

export interface BoxPlotStats {
  min: number
  q1: number
  median: number
  q3: number
  max: number
  outliers: number[]
}

export interface HistogramBin {
  start: number
  end: number
  count: number
  label: string
}

export interface CorrelationMatrix {
  columns: string[]
  values: (number | null)[][]
  /** Columns excluded and why */
  excluded: { column: string; reason: string }[]
}

// ── Visualization wizard step ────────────────────────────────────────────

export type VisualizationStep =
  | 'upload'
  | 'chart-type'
  | 'configure'
  | 'customize'
  | 'preview'

// ── Visualization session ─────────────────────────────────────────────────

export interface VisualizationSession {
  step: VisualizationStep
  dataset: ParsedDataset | null
  columnMetas: ColumnMeta[]
  chartConfig: ChartConfig | null
  isLoading: boolean
  error: string | null
}

// ── Color palettes ────────────────────────────────────────────────────────

export const COLOR_PALETTES: Record<ColorPaletteName, string[]> = {
  datasphere: ['#3B5BDB', '#4C6EF5', '#748FFC', '#91A7FF', '#0CA678', '#099268', '#38D9A9', '#63E6BE'],
  emerald:    ['#0CA678', '#099268', '#38D9A9', '#20C997', '#12B886', '#087F5B', '#63E6BE', '#96F2D7'],
  warm:       ['#E67700', '#F76707', '#FD7E14', '#FF922B', '#FFA94D', '#FFD43B', '#D9480F', '#E8590C'],
  cool:       ['#1971C2', '#1C7ED6', '#339AF0', '#74C0FC', '#6741D9', '#7950F2', '#9775FA', '#B197FC'],
  monochrome: ['#0F172A', '#1E293B', '#334155', '#475569', '#64748B', '#94A3B8', '#CBD5E1', '#E2E8F0'],
}

// ── Chart Registry ────────────────────────────────────────────────────────

export const CHART_REGISTRY: Record<ChartType, ChartRegistryEntry> = {
  'bar-vertical': {
    chartType: 'bar-vertical',
    displayName: 'Vertical Bar',
    description: 'Compare values across categories using vertical bars.',
    category: 'standard',
    requiredRoles: ['xAxis', 'yAxis'],
    optionalRoles: ['series'],
    roleTypeConstraints: { xAxis: ['categorical', 'date'], yAxis: ['numeric'], series: ['categorical'] },
    showsStatisticsPanel: false,
  },
  'bar-horizontal': {
    chartType: 'bar-horizontal',
    displayName: 'Horizontal Bar',
    description: 'Compare values across categories with horizontal bars.',
    category: 'standard',
    requiredRoles: ['xAxis', 'yAxis'],
    optionalRoles: ['series'],
    roleTypeConstraints: { xAxis: ['categorical', 'date'], yAxis: ['numeric'], series: ['categorical'] },
    showsStatisticsPanel: false,
  },
  'bar-grouped': {
    chartType: 'bar-grouped',
    displayName: 'Grouped Bar',
    description: 'Compare multiple series side-by-side per category.',
    category: 'standard',
    requiredRoles: ['xAxis', 'yAxis', 'series'],
    optionalRoles: [],
    roleTypeConstraints: { xAxis: ['categorical', 'date'], yAxis: ['numeric'], series: ['categorical'] },
    showsStatisticsPanel: false,
  },
  'bar-stacked': {
    chartType: 'bar-stacked',
    displayName: 'Stacked Bar',
    description: 'Show part-to-whole relationships across categories.',
    category: 'standard',
    requiredRoles: ['xAxis', 'yAxis', 'series'],
    optionalRoles: [],
    roleTypeConstraints: { xAxis: ['categorical', 'date'], yAxis: ['numeric'], series: ['categorical'] },
    showsStatisticsPanel: false,
  },
  'line': {
    chartType: 'line',
    displayName: 'Line Chart',
    description: 'Show trends over a continuous or ordered axis.',
    category: 'standard',
    requiredRoles: ['xAxis', 'yAxis'],
    optionalRoles: ['series'],
    roleTypeConstraints: { yAxis: ['numeric'], series: ['categorical'] },
    showsStatisticsPanel: false,
  },
  'area': {
    chartType: 'area',
    displayName: 'Area Chart',
    description: 'Like a line chart but with filled area below the line.',
    category: 'standard',
    requiredRoles: ['xAxis', 'yAxis'],
    optionalRoles: ['series'],
    roleTypeConstraints: { yAxis: ['numeric'], series: ['categorical'] },
    showsStatisticsPanel: false,
  },
  'pie': {
    chartType: 'pie',
    displayName: 'Pie Chart',
    description: 'Show proportions of a whole across categories.',
    category: 'standard',
    requiredRoles: ['category', 'value'],
    optionalRoles: [],
    roleTypeConstraints: { category: ['categorical'], value: ['numeric'] },
    showsStatisticsPanel: false,
  },
  'scatter': {
    chartType: 'scatter',
    displayName: 'Scatter Plot',
    description: 'Explore relationships between two numeric variables.',
    category: 'standard',
    requiredRoles: ['xAxis', 'yAxis'],
    optionalRoles: ['colorGroup'],
    roleTypeConstraints: { xAxis: ['numeric'], yAxis: ['numeric'], colorGroup: ['categorical'] },
    showsStatisticsPanel: true,
  },
  'histogram': {
    chartType: 'histogram',
    displayName: 'Histogram',
    description: 'Display the distribution of a numeric variable in bins.',
    category: 'statistical',
    requiredRoles: ['xAxis'],
    optionalRoles: [],
    roleTypeConstraints: { xAxis: ['numeric'] },
    showsStatisticsPanel: true,
  },
  'box-plot': {
    chartType: 'box-plot',
    displayName: 'Box Plot',
    description: 'Show quartile distributions and identify outliers.',
    category: 'statistical',
    requiredRoles: ['yAxis'],
    optionalRoles: ['xAxis'],
    roleTypeConstraints: { yAxis: ['numeric'], xAxis: ['categorical'] },
    showsStatisticsPanel: true,
  },
  'heatmap-correlation': {
    chartType: 'heatmap-correlation',
    displayName: 'Correlation Heatmap',
    description: 'Visualize Pearson correlations between numeric columns.',
    category: 'statistical',
    requiredRoles: [],
    optionalRoles: ['measures'],
    roleTypeConstraints: { measures: ['numeric'] },
    showsStatisticsPanel: true,
  },
  'combo-bar-line': {
    chartType: 'combo-bar-line',
    displayName: 'Combo Chart',
    description: 'Overlay a bar series and a line series on a shared axis.',
    category: 'advanced',
    requiredRoles: ['xAxis', 'barSeries', 'lineSeries'],
    optionalRoles: [],
    roleTypeConstraints: { xAxis: ['categorical', 'date'], barSeries: ['numeric'], lineSeries: ['numeric'] },
    showsStatisticsPanel: false,
  },
  'line-multi-series': {
    chartType: 'line-multi-series',
    displayName: 'Multi-Series Line',
    description: 'Plot multiple numeric columns as separate line series.',
    category: 'advanced',
    requiredRoles: ['xAxis', 'measures'],
    optionalRoles: [],
    roleTypeConstraints: { measures: ['numeric'] },
    showsStatisticsPanel: false,
  },
  'faceted': {
    chartType: 'faceted',
    displayName: 'Faceted Charts',
    description: 'Create separate sub-charts per category value (max 12 panels).',
    category: 'advanced',
    requiredRoles: ['xAxis', 'yAxis', 'facetBy'],
    optionalRoles: [],
    roleTypeConstraints: { xAxis: ['categorical', 'date', 'numeric'], yAxis: ['numeric'], facetBy: ['categorical'] },
    showsStatisticsPanel: false,
  },
}

// ── Default values ────────────────────────────────────────────────────────

export function defaultTransformConfig(): TransformConfig {
  return {
    filters: [],
    sortRules: [],
    aggregation: { method: 'none' },
    excludeMissingValues: false,
    binCount: 20,
  }
}

export function defaultCustomization(): ChartCustomization {
  return {
    title: '',
    subtitle: '',
    xAxisLabel: '',
    yAxisLabel: '',
    showDataLabels: false,
    showLegend: true,
    legendPosition: 'top',
    colorPalette: 'datasphere',
    seriesColors: {},
    markerSize: 4,
    numberFormat: 'plain',
    dateFormat: 'YYYY-MM-DD',
    yAxisScale: 'linear',
    showRegressionLine: false,
  }
}

export function defaultChartConfig(chartType: ChartType): ChartConfig {
  return {
    chartType,
    fieldMapping: {},
    transform: defaultTransformConfig(),
    customization: defaultCustomization(),
    showRegressionLine: false,
  }
}

export const defaultVisualizationSession: VisualizationSession = {
  step: 'upload',
  dataset: null,
  columnMetas: [],
  chartConfig: null,
  isLoading: false,
  error: null,
}
