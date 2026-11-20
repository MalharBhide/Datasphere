/**
 * DataVisualizationPage
 *
 * Orchestrates the 5-step visualization wizard:
 *   1. Upload   — Load a dataset
 *   2. Chart Type — Select from 14 chart types
 *   3. Configure  — Map fields, aggregation, filters (+ inline stats for stat chart types)
 *   4. Customize  — Titles, colors, axes, live preview
 *   5. Preview & Export — Full-width chart + PNG/SVG download
 */
import { useMemo, useRef } from 'react'
import { useVisualizationSession } from '../contexts/VisualizationContext'
import { DatasetUpload } from '../features/visualization/components/DatasetUpload'
import { ChartTypeSelector } from '../features/visualization/components/ChartTypeSelector'
import { FieldMappingPanel } from '../features/visualization/components/FieldMappingPanel'
import { AggregationPanel } from '../features/visualization/components/AggregationPanel'
import { CustomizationPanel } from '../features/visualization/components/CustomizationPanel'
import { ChartPreview, type ChartPreviewHandle } from '../features/visualization/components/ChartPreview'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import type { VisualizationStep, ChartType, FieldMapping, TransformConfig, ChartCustomization, TransformedDataset } from '../features/visualization/types'
import { defaultChartConfig } from '../features/visualization/types'
import { validateChartConfig } from '../features/visualization/lib/chartConfigValidator'
import { transformDataset, transformWithAggregation } from '../features/visualization/lib/transformer'
import { buildEChartsOption, type EChartsOption } from '../features/visualization/lib/echartsBuilder'
import { histogramBins, computeBoxPlot, correlationMatrix, linearRegression } from '../features/visualization/lib/statsCalculator'
import { StatisticsPanel } from '../features/visualization/components/StatisticsPanel'
import { ExportPanel } from '../features/visualization/components/ExportPanel'

// ── Step indicator ────────────────────────────────────────────────────────

const VIZ_STEPS: { key: VisualizationStep; label: string }[] = [
  { key: 'chart-type', label: 'Chart Type' },
  { key: 'configure', label: 'Configure' },
  { key: 'customize', label: 'Customize' },
  { key: 'preview', label: 'Preview & Export' },
]

const STEP_ORDER: VisualizationStep[] = ['chart-type', 'configure', 'customize', 'preview']

function StepIndicator({ currentStep }: { currentStep: VisualizationStep }) {
  if (currentStep === 'upload') return null
  const currentIndex = STEP_ORDER.indexOf(currentStep)

  return (
    <div className="flex items-center gap-1 mb-6">
      {VIZ_STEPS.map(({ key, label }, i) => {
        const isCurrent = currentStep === key
        const isPast = i < currentIndex
        return (
          <div key={key} className="flex items-center gap-1">
            {i > 0 && (
              <svg className="w-3 h-3 mx-0.5" style={{ color: 'var(--ds-text-muted)' }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            )}
            <span
              className={['text-[13px] font-medium', isCurrent ? 'font-semibold' : ''].join(' ')}
              style={{
                color: isCurrent ? 'var(--ds-primary)' : isPast ? 'var(--ds-text-secondary)' : 'var(--ds-text-muted)',
              }}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Dataset info bar ──────────────────────────────────────────────────────

function DatasetInfoBar({ fileName, rowCount, colCount, onReset }: {
  fileName: string
  rowCount: number
  colCount: number
  onReset: () => void
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 mb-5 px-4 py-2.5 rounded-lg border text-sm"
      style={{ background: 'var(--ds-surface)', borderColor: 'var(--ds-border)' }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" style={{ color: 'var(--ds-primary)' }} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
        </svg>
        <span className="truncate font-medium" style={{ color: 'var(--ds-text-primary)', fontFamily: 'var(--ds-font-mono)', fontSize: '12px' }}>
          {fileName}
        </span>
        <span style={{ color: 'var(--ds-text-muted)', fontSize: '12px' }}>
          {rowCount.toLocaleString()} rows · {colCount} cols
        </span>
      </div>
      <button
        onClick={onReset}
        className="text-xs shrink-0 transition-colors duration-150 cursor-pointer"
        style={{ color: 'var(--ds-text-muted)' }}
      >
        ← Upload different file
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export function DataVisualizationPage() {
  const { session, setSession, resetSession } = useVisualizationSession()
  const { step, dataset, columnMetas, chartConfig } = session
  const chartRef = useRef<ChartPreviewHandle>(null)

  // Build validation result whenever chartConfig or columnMetas changes
  const validationResult = useMemo(() => {
    if (!chartConfig) return { valid: false, errors: ['No chart configured.'], warnings: [] }
    return validateChartConfig(chartConfig, columnMetas)
  }, [chartConfig, columnMetas])

  // Build transformed dataset + ECharts option (handles all 14 chart types)
  const { transformed, echartsOption } = useMemo<{
    transformed: TransformedDataset | null
    echartsOption: EChartsOption | null
  }>(() => {
    if (!chartConfig || !dataset || !validationResult.valid) {
      return { transformed: null, echartsOption: null }
    }
    try {
      const { chartType, fieldMapping, transform } = chartConfig

      // ── Statistical chart types: pre-compute data ──────────────────────
      if (chartType === 'histogram') {
        const col = fieldMapping.xAxis!
        const baseRows = transformDataset(dataset, transform)
        const values = baseRows.rows.map((r) => r[col])
        const bins = histogramBins(values, transform.binCount)
        const histRows = bins.map((b) => ({ label: b.label, count: b.count }))
        const t: TransformedDataset = { columns: ['label', 'count'], rows: histRows, excludedRowCount: baseRows.excludedRowCount, excludedReasons: baseRows.excludedReasons, wasAggregated: true }
        return { transformed: t, echartsOption: buildEChartsOption(chartConfig, t, columnMetas) }
      }

      if (chartType === 'box-plot') {
        const yCol = fieldMapping.yAxis!
        const xCol = fieldMapping.xAxis
        const baseRows = transformDataset(dataset, transform)

        let boxRows: import('../features/visualization/types').Row[]
        if (xCol) {
          const categories = [...new Set(baseRows.rows.map((r) => String(r[xCol] ?? '')))]
          boxRows = categories.map((cat) => {
            const vals = baseRows.rows.filter((r) => String(r[xCol]) === cat).map((r) => r[yCol])
            const stats = computeBoxPlot(vals)
            return { category: cat, min: stats.min, q1: stats.q1, median: stats.median, q3: stats.q3, max: stats.max, outliers: stats.outliers.join(',') }
          })
        } else {
          const vals = baseRows.rows.map((r) => r[yCol])
          const stats = computeBoxPlot(vals)
          boxRows = [{ category: yCol, min: stats.min, q1: stats.q1, median: stats.median, q3: stats.q3, max: stats.max, outliers: stats.outliers.join(',') }]
        }
        const t: TransformedDataset = { columns: ['category', 'min', 'q1', 'median', 'q3', 'max', 'outliers'], rows: boxRows, excludedRowCount: baseRows.excludedRowCount, excludedReasons: baseRows.excludedReasons, wasAggregated: true }
        return { transformed: t, echartsOption: buildEChartsOption(chartConfig, t, columnMetas) }
      }

      if (chartType === 'heatmap-correlation') {
        const measures = fieldMapping.measures && fieldMapping.measures.length >= 2
          ? fieldMapping.measures
          : columnMetas.filter((c) => c.type === 'numeric').map((c) => c.name)
        const matrix = correlationMatrix(dataset, measures)
        const heatRows = []
        for (let i = 0; i < matrix.columns.length; i++) {
          for (let j = 0; j < matrix.columns.length; j++) {
            heatRows.push({ col1: matrix.columns[i], col2: matrix.columns[j], r: matrix.values[i][j] })
          }
        }
        const t: TransformedDataset = { columns: ['col1', 'col2', 'r'], rows: heatRows, excludedRowCount: 0, excludedReasons: matrix.excluded.map((e) => `${e.column}: ${e.reason}`), wasAggregated: true }
        return { transformed: t, echartsOption: buildEChartsOption(chartConfig, t, columnMetas) }
      }

      // ── Scatter with regression ────────────────────────────────────────
      if (chartType === 'scatter') {
        const baseRows = transformDataset(dataset, transform)
        const xCol = fieldMapping.xAxis!
        const yCol = fieldMapping.yAxis!
        let regression: ReturnType<typeof linearRegression> | null = null
        if (chartConfig.customization.showRegressionLine) {
          const xs = baseRows.rows.map((r) => Number(r[xCol])).filter(isFinite)
          const ys = baseRows.rows.map((r) => Number(r[yCol])).filter(isFinite)
          regression = linearRegression(xs, ys)
        }
        return { transformed: baseRows, echartsOption: buildEChartsOption(chartConfig, baseRows, columnMetas, regression) }
      }

      // ── Standard + advanced chart types with aggregation ───────────────
      const { aggregation } = transform
      if (aggregation.method !== 'none' && aggregation.groupByColumn) {
        const yCol = fieldMapping.yAxis ?? fieldMapping.value ?? fieldMapping.barSeries
        if (yCol) {
          const t = transformWithAggregation(dataset, transform, aggregation.groupByColumn, yCol)
          return { transformed: t, echartsOption: buildEChartsOption(chartConfig, t, columnMetas) }
        }
      }

      const t = transformDataset(dataset, transform)
      return { transformed: t, echartsOption: buildEChartsOption(chartConfig, t, columnMetas) }
    } catch {
      return { transformed: null, echartsOption: null }
    }
  }, [chartConfig, dataset, columnMetas, validationResult.valid])

  function handleSelectChartType(ct: ChartType) {
    setSession({ chartConfig: defaultChartConfig(ct), step: 'configure' })
  }

  function handleFieldMappingChange(mapping: FieldMapping) {
    if (!chartConfig) return
    setSession({ chartConfig: { ...chartConfig, fieldMapping: mapping } })
  }

  function handleTransformChange(transform: TransformConfig) {
    if (!chartConfig) return
    setSession({ chartConfig: { ...chartConfig, transform } })
  }

  function handleCustomizationChange(customization: ChartCustomization) {
    if (!chartConfig) return
    setSession({ chartConfig: { ...chartConfig, customization, showRegressionLine: customization.showRegressionLine } })
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8" style={{ minHeight: '100%' }}>
      {/* Page header */}
      <div className="mb-7">
        <h1 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--ds-text-primary)' }}>
          Data Visualization
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--ds-text-secondary)' }}>
          Upload a dataset, select a chart type, configure your visualization, and export.
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator currentStep={step} />

      {/* Dataset info bar (shown after upload) */}
      {step !== 'upload' && dataset && (
        <DatasetInfoBar
          fileName={dataset.fileName}
          rowCount={dataset.rows.length}
          colCount={dataset.columns.length}
          onReset={resetSession}
        />
      )}

      {/* ── Step 1: Upload ───────────────────────── */}
      {step === 'upload' && (
        <div className="max-w-lg mx-auto">
          <DatasetUpload />
        </div>
      )}

      {/* ── Step 2: Chart Type ───────────────────── */}
      {step === 'chart-type' && (
        <ChartTypeSelector
          onSelect={handleSelectChartType}
          onBack={resetSession}
        />
      )}

      {/* ── Step 3: Configure ───────────────────── */}
      {step === 'configure' && chartConfig && dataset && (
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
          {/* Left: config panels */}
          <div className="space-y-5">
            {/* Back + Chart type name */}
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setSession({ step: 'chart-type' })}>
                ← Back
              </Button>
              <span className="text-[13px] font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
                {chartConfig.chartType.replace(/-/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())}
              </span>
            </div>

            {/* Field Mapping */}
            <Card padding="md">
              <FieldMappingPanel
                config={chartConfig}
                columnMetas={columnMetas}
                validationResult={validationResult}
                onChange={handleFieldMappingChange}
              />
            </Card>

            {/* Aggregation & Filters */}
            <Card padding="md">
              <AggregationPanel
                config={chartConfig}
                columnMetas={columnMetas}
                onChange={handleTransformChange}
              />
            </Card>

            {/* Inline Statistics Panel for statistical chart types */}
            {dataset && ['scatter', 'histogram', 'box-plot', 'heatmap-correlation'].includes(chartConfig.chartType) && (
              <StatisticsPanel
                dataset={dataset}
                columnMetas={columnMetas}
                config={chartConfig}
              />
            )}

            {validationResult.valid && (
              <Button
                size="lg"
                onClick={() => setSession({ step: 'customize' })}
              >
                Continue to Customize →
              </Button>
            )}
          </div>

          {/* Right: live preview */}
          <div>
            <Card padding="sm">
              <div className="p-2 pb-0 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--ds-text-muted)' }}>
                  Live Preview
                </p>
                {transformed && (
                  <span className="text-[11px]" style={{ color: 'var(--ds-text-muted)' }}>
                    {transformed.rows.length.toLocaleString()} rows
                    {transformed.excludedRowCount > 0 && ` (${transformed.excludedRowCount} excluded)`}
                  </span>
                )}
              </div>
              {echartsOption && validationResult.valid ? (
                <ChartPreview
                  ref={chartRef}
                  option={echartsOption}
                  height={500}
                />
              ) : (
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{ height: '500px', background: 'var(--ds-bg)', color: 'var(--ds-text-muted)' }}
                >
                  <div className="text-center px-6">
                    <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                    <p className="text-sm">Complete the field mapping to see a live preview.</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ── Step 4: Customize ───────────────────── */}
      {step === 'customize' && chartConfig && (
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
          {/* Left: customization controls */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setSession({ step: 'configure' })}>
                ← Back
              </Button>
              <span className="text-[13px] font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
                Customize Appearance
              </span>
            </div>

            <CustomizationPanel
              customization={chartConfig.customization}
              chartType={chartConfig.chartType}
              onChange={handleCustomizationChange}
            />

            <Button
              size="lg"
              onClick={() => setSession({ step: 'preview' })}
            >
              Go to Preview &amp; Export →
            </Button>
          </div>

          {/* Right: live preview (updates in real time) */}
          <div>
            <Card padding="sm">
              <div className="p-2 pb-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--ds-text-muted)' }}>
                  Live Preview
                </p>
              </div>
              {echartsOption && validationResult.valid ? (
                <ChartPreview
                  ref={chartRef}
                  option={echartsOption}
                  height={560}
                />
              ) : (
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{ height: '560px', background: 'var(--ds-bg)', color: 'var(--ds-text-muted)' }}
                >
                  <p className="text-sm">Go back to Configure to fix field mapping.</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ── Step 5: Preview & Export ─────────────── */}
      {step === 'preview' && chartConfig && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => setSession({ step: 'customize' })}>
              ← Back
            </Button>
          </div>

          <Card padding="sm">
            <div className="p-2 pb-0 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--ds-text-muted)' }}>
                Chart Preview
              </p>
              {transformed && (
                <span className="text-[11px]" style={{ color: 'var(--ds-text-muted)' }}>
                  {dataset?.rows.length.toLocaleString()} rows
                  {transformed.excludedRowCount > 0 && ` (${transformed.excludedRowCount} excluded)`}
                </span>
              )}
            </div>

            {echartsOption && validationResult.valid ? (
              <ChartPreview
                ref={chartRef}
                option={echartsOption}
                height={520}
              />
            ) : (
              <div
                className="flex items-center justify-center rounded-xl m-2"
                style={{ height: '520px', background: 'var(--ds-bg)', color: 'var(--ds-text-muted)' }}
              >
                <p className="text-sm">Chart configuration is invalid. Go back to Configure.</p>
              </div>
            )}
          </Card>

          {/* Export buttons */}
          {echartsOption && validationResult.valid && (
            <ExportPanel
              chartRef={chartRef}
              option={echartsOption}
              chartTitle={chartConfig.customization.title || chartConfig.chartType}
              disabled={false}
            />
          )}

          {/* Stats summary below chart for statistical types */}
          {dataset && ['scatter', 'histogram', 'box-plot', 'heatmap-correlation'].includes(chartConfig.chartType) && (
            <StatisticsPanel
              dataset={dataset}
              columnMetas={columnMetas}
              config={chartConfig}
            />
          )}
        </div>
      )}
    </div>
  )
}
