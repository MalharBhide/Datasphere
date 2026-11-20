/**
 * StatisticsPanel.tsx
 *
 * Inline statistics panel shown in the Configure step (step 3) for
 * statistical chart types (scatter, histogram, box-plot, heatmap-correlation).
 *
 * Shows:
 * - Descriptive statistics for selected numeric columns
 * - Correlation info (shown inline on heatmap-correlation)
 * - Regression line info for scatter plots
 */
import { useState } from 'react'
import { Card } from '../../../components/Card'
import { describeColumn, linearRegression, correlationMatrix } from '../lib/statsCalculator'
import type { ParsedDataset, ColumnMeta, ChartConfig } from '../types'

interface StatisticsPanelProps {
  dataset: ParsedDataset
  columnMetas: ColumnMeta[]
  config: ChartConfig
}

function fmt(n: number): string {
  if (!isFinite(n)) return 'N/A'
  if (Math.abs(n) >= 1e6) return n.toExponential(3)
  if (Math.abs(n) >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 })
}

export function StatisticsPanel({ dataset, columnMetas, config }: StatisticsPanelProps) {
  const [expanded, setExpanded] = useState(true)
  const { chartType, fieldMapping, customization } = config

  const numericCols = columnMetas.filter((c) => c.type === 'numeric')

  // Determine which columns to describe
  let describeTargets: string[] = []
  if (chartType === 'scatter') {
    describeTargets = [fieldMapping.xAxis, fieldMapping.yAxis].filter(Boolean) as string[]
  } else if (chartType === 'histogram') {
    describeTargets = [fieldMapping.xAxis].filter(Boolean) as string[]
  } else if (chartType === 'box-plot') {
    describeTargets = [fieldMapping.yAxis].filter(Boolean) as string[]
  } else if (chartType === 'heatmap-correlation') {
    describeTargets = fieldMapping.measures ?? numericCols.slice(0, 8).map((c) => c.name)
  }

  if (describeTargets.length === 0) return null

  // Compute regression if scatter + showRegressionLine
  const regression = chartType === 'scatter' && customization.showRegressionLine && fieldMapping.xAxis && fieldMapping.yAxis
    ? (() => {
        const xs = dataset.rows.map((r) => Number(r[fieldMapping.xAxis!])).filter(isFinite)
        const ys = dataset.rows.map((r) => Number(r[fieldMapping.yAxis!])).filter(isFinite)
        return linearRegression(xs, ys)
      })()
    : null

  // Compute correlation for heatmap
  const corr = chartType === 'heatmap-correlation' && describeTargets.length >= 2
    ? correlationMatrix(dataset, describeTargets)
    : null

  return (
    <Card padding="md">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left cursor-pointer"
        aria-expanded={expanded}
      >
        <svg
          className={['w-3.5 h-3.5 transition-transform duration-150', expanded ? 'rotate-90' : ''].join(' ')}
          fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <span className="text-[13px] font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
          Statistical Analysis
        </span>
        <span className="text-[11px] ml-auto" style={{ color: 'var(--ds-text-muted)' }}>
          {describeTargets.length} column{describeTargets.length > 1 ? 's' : ''}
        </span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-5">
          {/* Descriptive statistics per column */}
          {describeTargets.map((col) => {
            const values = dataset.rows.map((r) => r[col])
            const stats = describeColumn(values)
            return (
              <div key={col}>
                <p className="text-[12px] font-semibold mb-2" style={{ color: 'var(--ds-text-primary)', fontFamily: 'var(--ds-font-mono)' }}>
                  {col}
                  <span className="ml-2 font-normal" style={{ color: 'var(--ds-text-muted)' }}>
                    ({stats.count} values, {stats.missingCount} missing)
                  </span>
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
                  {[
                    { label: 'Mean', value: fmt(stats.mean) },
                    { label: 'Median', value: fmt(stats.median) },
                    { label: 'Mode', value: stats.mode.length > 0 ? stats.mode.slice(0, 3).map(fmt).join(', ') : 'N/A' },
                    { label: 'Min', value: fmt(stats.min) },
                    { label: 'Max', value: fmt(stats.max) },
                    { label: 'Range', value: fmt(stats.range) },
                    { label: 'Std Dev', value: fmt(stats.stddev) },
                    { label: 'Variance', value: fmt(stats.variance) },
                    { label: 'Q1', value: fmt(stats.q1) },
                    { label: 'Q3', value: fmt(stats.q3) },
                    { label: 'IQR', value: fmt(stats.iqr) },
                    { label: 'P5', value: fmt(stats.p5) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between gap-2">
                      <span className="text-[11px]" style={{ color: 'var(--ds-text-muted)' }}>{label}</span>
                      <span className="text-[11px] font-medium" style={{ color: 'var(--ds-text-primary)', fontFamily: 'var(--ds-font-mono)' }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Regression info */}
          {regression && (
            <div
              className="rounded-lg border p-3"
              style={{ background: 'var(--ds-primary-light)', borderColor: 'var(--ds-primary-mid)' }}
            >
              <p className="text-[12px] font-semibold mb-1" style={{ color: 'var(--ds-primary)' }}>
                Linear Regression
              </p>
              <p className="text-[12px]" style={{ color: 'var(--ds-text-secondary)', fontFamily: 'var(--ds-font-mono)' }}>
                y = {regression.slope.toFixed(4)}x + {regression.intercept.toFixed(4)}
              </p>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--ds-text-secondary)', fontFamily: 'var(--ds-font-mono)' }}>
                R² = {regression.rSquared.toFixed(4)}
              </p>
            </div>
          )}

          {/* Correlation exclusions */}
          {corr && corr.excluded.length > 0 && (
            <div
              className="rounded-lg border p-3"
              style={{ background: 'var(--ds-warning-light)', borderColor: '#FED7AA' }}
            >
              <p className="text-[12px] font-semibold mb-1" style={{ color: 'var(--ds-warning)' }}>
                Excluded from correlation matrix:
              </p>
              {corr.excluded.map((e) => (
                <p key={e.column} className="text-[11px]" style={{ color: 'var(--ds-text-secondary)' }}>
                  <strong>{e.column}</strong>: {e.reason}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
