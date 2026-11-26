/**
 * PredictiveAnalyticsPage.tsx
 *
 * Predictive Analytics feature — IBM five-step framework:
 * 1. Define Problem  → method card selection
 * 2. Select Data     → pick original or cleaned dataset from context
 * 3. Prepare Data    → handled inside regression/forecasting libs (exclude bad rows)
 * 4. Develop Model   → run analysis
 * 5. Present Results → chart + stats panel
 *
 * Layout: left config panel (w-80) + right results panel (flex-1)
 */
import { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { usePredictive } from '../contexts/PredictiveContext'
import { useCleaningSession } from '../contexts/CleaningSessionContext'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import type { ParsedDataset } from '../features/cleaning/types'
import { runLinearRegression, predictY } from '../features/predictive/lib/regression'
import type { RegressionResult, RegressionError } from '../features/predictive/lib/regression'
import { runForecast } from '../features/predictive/lib/forecasting'
import type { ForecastResult, ForecastError } from '../features/predictive/lib/forecasting'
import type { AnalysisMethod } from '../contexts/PredictiveContext'

// ── Helpers ───────────────────────────────────────────────────────────────

function isRegressionResult(r: RegressionResult | RegressionError | null): r is RegressionResult {
  return r !== null && !('kind' in r)
}

function isRegressionError(r: RegressionResult | RegressionError | null): r is RegressionError {
  return r !== null && 'kind' in r
}

function isForecastResult(r: ForecastResult | ForecastError | null): r is ForecastResult {
  return r !== null && !('kind' in r)
}

function isForecastError(r: ForecastResult | ForecastError | null): r is ForecastError {
  return r !== null && 'kind' in r
}

function numericColumns(dataset: ParsedDataset): string[] {
  return dataset.columns.filter((col) => {
    const vals = dataset.rows
      .map((r) => r[col])
      .filter((v) => v !== null && v !== undefined && String(v).trim() !== '')
    if (vals.length === 0) return false
    const numericCount = vals.filter((v) => isFinite(Number(v))).length
    return numericCount / vals.length > 0.5
  })
}

function dateColumns(dataset: ParsedDataset): string[] {
  const DATE_PATTERNS = [
    /^\d{4}-\d{2}-\d{2}/,
    /^\d{2}\/\d{2}\/\d{4}/,
    /^\d{2}-\d{2}-\d{4}/,
    /^\d{4}\/\d{2}\/\d{2}/,
  ]
  return dataset.columns.filter((col) => {
    const vals = dataset.rows
      .map((r) => r[col])
      .filter((v) => v !== null && v !== undefined && String(v).trim() !== '')
    if (vals.length === 0) return false
    const dateCount = vals.filter((v) => {
      const s = String(v).trim()
      return DATE_PATTERNS.some((p) => p.test(s)) || (!isNaN(new Date(s).getTime()) && isNaN(Number(s)))
    }).length
    return dateCount / vals.length > 0.5
  })
}

function fmt4(n: number): string {
  return n.toFixed(4)
}

// ── SVG icons ─────────────────────────────────────────────────────────────

function IconRegression() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l4-8 4 3 4-6 4 4" />
    </svg>
  )
}

function IconTimeSeries() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  )
}

function IconWarning() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  )
}

function IconInfo() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────

function MethodCard({
  method,
  current,
  title,
  description,
  icon,
  onSelect,
}: {
  method: AnalysisMethod
  current: AnalysisMethod
  title: string
  description: string
  icon: React.ReactNode
  onSelect: (m: AnalysisMethod) => void
}) {
  const isActive = method === current
  return (
    <button
      type="button"
      onClick={() => onSelect(method)}
      className="w-full text-left rounded-lg border p-3 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
      style={{
        borderColor: isActive ? 'var(--ds-primary)' : 'var(--ds-border)',
        background: isActive ? 'var(--ds-primary-light)' : 'var(--ds-surface)',
        // @ts-expect-error CSS custom property
        '--tw-ring-color': 'var(--ds-border-focus)',
      }}
      aria-pressed={isActive}
    >
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color: isActive ? 'var(--ds-primary)' : 'var(--ds-text-secondary)' }}>
          {icon}
        </span>
        <span
          className="text-[13px] font-semibold"
          style={{ color: isActive ? 'var(--ds-primary)' : 'var(--ds-text-primary)' }}
        >
          {title}
        </span>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--ds-text-secondary)' }}>
        {description}
      </p>
    </button>
  )
}

function LabeledSelect({
  label,
  id,
  value,
  onChange,
  children,
  disabled,
}: {
  label: string
  id: string
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium mb-1" style={{ color: 'var(--ds-text-secondary)' }}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full h-8 px-2.5 rounded-lg border text-[13px] transition-colors duration-150 disabled:opacity-50"
        style={{
          borderColor: 'var(--ds-border)',
          color: 'var(--ds-text-primary)',
          background: 'var(--ds-surface)',
        }}
      >
        {children}
      </select>
    </div>
  )
}

function LabeledInput({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  min,
  max,
}: {
  label: string
  id: string
  type?: 'text' | 'number'
  value: string
  onChange: (v: string) => void
  placeholder?: string
  min?: number
  max?: number
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium mb-1" style={{ color: 'var(--ds-text-secondary)' }}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        min={min}
        max={max}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 px-2.5 rounded-lg border text-[13px] transition-colors duration-150"
        style={{
          borderColor: 'var(--ds-border)',
          color: 'var(--ds-text-primary)',
          background: 'var(--ds-surface)',
        }}
      />
    </div>
  )
}

function WarningBanner({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null
  return (
    <div
      className="rounded-lg p-3 flex flex-col gap-1.5"
      style={{ background: 'var(--ds-warning-light)', border: '1px solid var(--ds-warning)' }}
      role="alert"
    >
      {messages.map((m, i) => (
        <div key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--ds-warning)' }}>
          <IconWarning />
          <span>{m}</span>
        </div>
      ))}
    </div>
  )
}

function InfoBanner({ message }: { message: string }) {
  return (
    <div
      className="rounded-lg p-3 flex items-start gap-2"
      style={{ background: 'var(--ds-primary-light)', border: '1px solid var(--ds-primary-mid)' }}
    >
      <span style={{ color: 'var(--ds-primary)' }}><IconInfo /></span>
      <p className="text-xs" style={{ color: 'var(--ds-primary)' }}>{message}</p>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="rounded-lg p-3 flex items-start gap-2"
      style={{ background: 'var(--ds-danger-light)', border: '1px solid var(--ds-danger)' }}
      role="alert"
    >
      <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" style={{ color: 'var(--ds-danger)' }} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      <p className="text-xs" style={{ color: 'var(--ds-danger)' }}>{message}</p>
    </div>
  )
}

// ── Regression chart ──────────────────────────────────────────────────────

function RegressionChart({ result, xCol, yCol }: {
  result: RegressionResult
  xCol: string
  yCol: string
}) {
  const scatterData = result.xValues.map((x, i) => [x, result.yValues[i]])

  // Regression line: two endpoints spanning the x range
  const xMin = Math.min(...result.xValues)
  const xMax = Math.max(...result.xValues)
  const lineData = [
    [xMin, result.slope * xMin + result.intercept],
    [xMax, result.slope * xMax + result.intercept],
  ]

  const option = {
    color: ['#3B5BDB', '#D63939'],
    animation: false,
    tooltip: { trigger: 'item' },
    legend: {
      data: ['Observations', 'Regression line'],
      bottom: 0,
      textStyle: { fontSize: 12 },
    },
    grid: { top: 24, right: 24, bottom: 48, left: 56, containLabel: true },
    xAxis: {
      type: 'value',
      name: xCol,
      nameLocation: 'middle',
      nameGap: 32,
      axisLabel: { fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: yCol,
      nameLocation: 'middle',
      nameGap: 48,
      axisLabel: { fontSize: 11 },
    },
    series: [
      {
        name: 'Observations',
        type: 'scatter',
        symbolSize: 7,
        data: scatterData,
        itemStyle: { color: '#3B5BDB', opacity: 0.75 },
      },
      {
        name: 'Regression line',
        type: 'line',
        data: lineData,
        lineStyle: { color: '#D63939', width: 2, type: 'solid' },
        symbol: 'none',
        tooltip: { show: false },
      },
    ],
  }

  return (
    <ReactECharts
      option={option}
      style={{ height: 320, width: '100%' }}
      opts={{ renderer: 'canvas' }}
      notMerge
    />
  )
}

// ── Forecast chart ────────────────────────────────────────────────────────

function ForecastChart({ result, valueCol }: {
  result: ForecastResult
  valueCol: string
}) {
  const historicalLabels = result.historical.map((p) => p.label)
  const historicalValues = result.historical.map((p) => p.value)
  const forecastLabels = result.forecast.map((p) => p.label)
  const forecastValues = result.forecast.map((p) => p.value)

  // Bridge: connect last historical point to the first forecast point for visual continuity
  const bridgeValue = historicalValues[historicalValues.length - 1]

  const allLabels = [...historicalLabels, ...forecastLabels]

  const option = {
    color: ['#3B5BDB', '#0CA678'],
    animation: false,
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown[]) => {
        const pts = params as { seriesName: string; value: number | null; name: string }[]
        const label = pts[0]?.name ?? ''
        const lines = pts
          .filter((p) => p.value !== null)
          .map((p) => `${p.seriesName}: <b>${typeof p.value === 'number' ? p.value.toFixed(3) : '—'}</b>`)
        return `${label}<br/>${lines.join('<br/>')}`
      },
    },
    legend: {
      data: ['Historical', 'Forecast (estimate)'],
      bottom: 0,
      textStyle: { fontSize: 12 },
    },
    grid: { top: 24, right: 24, bottom: 56, left: 56, containLabel: true },
    xAxis: {
      type: 'category',
      data: allLabels,
      axisLabel: { fontSize: 10, rotate: 30, interval: 'auto' },
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      name: valueCol,
      nameLocation: 'middle',
      nameGap: 48,
      axisLabel: { fontSize: 11 },
    },
    series: [
      {
        name: 'Historical',
        type: 'line',
        data: historicalValues,
        lineStyle: { color: '#3B5BDB', width: 2 },
        itemStyle: { color: '#3B5BDB' },
        symbolSize: 5,
        connectNulls: false,
      },
      {
        name: 'Forecast (estimate)',
        type: 'line',
        // Forecast series starts from the bridge (last historical label)
        // We use a markArea to highlight the forecast zone visually
        data: (() => {
          // Align with allLabels: nulls for history except last, then forecast
          const arr: (number | null)[] = []
          for (let i = 0; i < historicalLabels.length - 1; i++) arr.push(null)
          arr.push(bridgeValue) // connect from last historical
          for (const v of forecastValues) arr.push(v)
          return arr
        })(),
        lineStyle: { color: '#0CA678', width: 2, type: 'dashed' },
        itemStyle: { color: '#0CA678' },
        symbolSize: 5,
        connectNulls: false,
      },
    ],
  }

  return (
    <ReactECharts
      option={option}
      style={{ height: 320, width: '100%' }}
      opts={{ renderer: 'canvas' }}
      notMerge
    />
  )
}

// ── Forecast table ────────────────────────────────────────────────────────

function ForecastTable({ result }: { result: ForecastResult }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--ds-bg)', borderBottom: '1px solid var(--ds-border)' }}>
            <th className="text-left px-3 py-2 font-semibold text-xs" style={{ color: 'var(--ds-text-secondary)' }}>Period</th>
            <th className="text-right px-3 py-2 font-semibold text-xs" style={{ color: 'var(--ds-text-secondary)' }}>Predicted Value</th>
            <th className="text-right px-3 py-2 font-semibold text-xs" style={{ color: 'var(--ds-text-secondary)' }}>Note</th>
          </tr>
        </thead>
        <tbody>
          {result.forecast.map((p, i) => (
            <tr
              key={p.label}
              style={{ borderBottom: '1px solid var(--ds-border)' }}
            >
              <td className="px-3 py-2 font-mono text-xs" style={{ color: 'var(--ds-text-primary)' }}>{p.label}</td>
              <td className="px-3 py-2 text-right font-mono text-xs" style={{ color: 'var(--ds-accent)', fontFamily: 'var(--ds-font-mono)' }}>{p.value.toFixed(4)}</td>
              <td className="px-3 py-2 text-right text-xs" style={{ color: 'var(--ds-text-muted)' }}>
                {i === 0 ? 'estimate' : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Stat row ──────────────────────────────────────────────────────────────

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: 'var(--ds-border)' }}>
      <span className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>{label}</span>
      <span className="text-xs font-mono font-medium" style={{ color: 'var(--ds-text-primary)', fontFamily: 'var(--ds-font-mono)' }}>{value}</span>
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyResults({ method }: { method: AnalysisMethod }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[320px] gap-4 py-16">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: 'var(--ds-primary-light)', color: 'var(--ds-primary)' }}
      >
        {method === 'linear-regression' ? <IconRegression /> : <IconTimeSeries />}
      </div>
      <div className="text-center max-w-xs">
        <p className="text-[15px] font-semibold mb-1" style={{ color: 'var(--ds-text-primary)' }}>
          Configure and run the analysis
        </p>
        <p className="text-sm" style={{ color: 'var(--ds-text-secondary)' }}>
          {method === 'linear-regression'
            ? 'Select a dataset, choose X and Y columns, then click Run Analysis to generate a regression model.'
            : 'Select a dataset, choose a date and value column, set the forecast horizon, then click Run Analysis.'}
        </p>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────

export function PredictiveAnalyticsPage() {
  const { session, setSession, resetResults } = usePredictive()
  const { session: cleaningSession } = useCleaningSession()
  const [runKey, setRunKey] = useState(0)

  // Determine available datasets
  const originalDataset: ParsedDataset | null = cleaningSession.dataset
  const cleanedDataset: ParsedDataset | null = cleaningSession.cleaningResult
    ? {
        fileName: `${cleaningSession.dataset?.fileName ?? 'dataset'} (cleaned)`,
        columns: cleaningSession.dataset?.columns ?? [],
        rows: cleaningSession.cleaningResult.cleanedRows,
      }
    : null

  const activeDataset: ParsedDataset | null = useMemo(() => {
    if (session.datasetSource === 'original') return originalDataset
    if (session.datasetSource === 'cleaned') return cleanedDataset
    return null
  }, [session.datasetSource, originalDataset, cleanedDataset])

  const numCols = useMemo(() => activeDataset ? numericColumns(activeDataset) : [], [activeDataset])
  const dateCols = useMemo(() => activeDataset ? dateColumns(activeDataset) : [], [activeDataset])

  // Derived: predicted Y value for regression
  const predictedY = useMemo(() => {
    if (!isRegressionResult(session.regressionResult)) return null
    const xNum = Number(session.predictX)
    if (!isFinite(xNum)) return null
    return predictY(session.regressionResult.slope, session.regressionResult.intercept, xNum)
  }, [session.regressionResult, session.predictX])

  // ── Handlers ────────────────────────────────────────────────────────────

  function handleMethodChange(m: AnalysisMethod) {
    setSession({ method: m, regressionResult: null, forecastResult: null })
  }

  function handleDatasetSourceChange(src: 'original' | 'cleaned') {
    setSession({
      datasetSource: src,
      xCol: '',
      yCol: '',
      dateCol: '',
      valueCol: '',
      regressionResult: null,
      forecastResult: null,
    })
  }

  function handleRunAnalysis() {
    if (!activeDataset) return

    if (session.method === 'linear-regression') {
      const result = runLinearRegression({
        dataset: activeDataset,
        xCol: session.xCol,
        yCol: session.yCol,
      })
      setSession({ regressionResult: result, forecastResult: null })
    } else {
      const periodsNum = Number(session.periods)
      const result = runForecast({
        dataset: activeDataset,
        dateCol: session.dateCol,
        valueCol: session.valueCol,
        periods: isFinite(periodsNum) ? Math.round(periodsNum) : 5,
      })
      setSession({ forecastResult: result, regressionResult: null })
    }
    setRunKey((k) => k + 1)
  }

  // ── Validation — enable Run button ───────────────────────────────────────
  const canRun = useMemo(() => {
    if (!activeDataset) return false
    if (session.method === 'linear-regression') {
      return session.xCol !== '' && session.yCol !== '' && session.xCol !== session.yCol
    }
    return session.dateCol !== '' && session.valueCol !== ''
  }, [activeDataset, session])

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full" style={{ background: 'var(--ds-bg)' }}>
      <div className="max-w-[1200px] mx-auto px-6 py-8">

        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ background: 'var(--ds-accent-light)', color: 'var(--ds-accent)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--ds-accent)' }} aria-hidden="true" />
              Step 4 of 4
            </span>
          </div>
          <h1 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--ds-text-primary)' }}>
            Predictive Analytics
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ds-text-secondary)' }}>
            Build predictive models using your datasets. All calculations happen in your browser — no data is sent anywhere.
          </p>
        </div>

        {/* Two-panel layout */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">

          {/* ── LEFT: Configuration panel ──────────────── */}
          <div className="w-full lg:w-72 shrink-0 flex flex-col gap-4">

            {/* 1. Method selection */}
            <Card padding="md">
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--ds-text-muted)' }}>
                1 — Analysis Method
              </p>
              <div className="flex flex-col gap-2">
                <MethodCard
                  method="linear-regression"
                  current={session.method}
                  title="Linear Regression"
                  description="Predict a numerical outcome from one numerical input variable using a straight-line model."
                  icon={<IconRegression />}
                  onSelect={handleMethodChange}
                />
                <MethodCard
                  method="time-series"
                  current={session.method}
                  title="Time-Series Forecast"
                  description="Predict future values by projecting the linear trend in historical time-ordered data."
                  icon={<IconTimeSeries />}
                  onSelect={handleMethodChange}
                />
              </div>
            </Card>

            {/* 2. Dataset selection */}
            <Card padding="md">
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--ds-text-muted)' }}>
                2 — Select Dataset
              </p>
              {!originalDataset ? (
                <InfoBanner message="No dataset loaded. Upload a file in Data Cleaning first." />
              ) : (
                <div className="flex flex-col gap-2">
                  {/* Original dataset */}
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="dataset-source"
                      value="original"
                      checked={session.datasetSource === 'original'}
                      onChange={() => handleDatasetSourceChange('original')}
                      className="mt-0.5"
                      style={{ accentColor: 'var(--ds-primary)' }}
                    />
                    <div>
                      <span className="text-[13px] font-medium block" style={{ color: 'var(--ds-text-primary)' }}>
                        Original dataset
                      </span>
                      <span className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>
                        {originalDataset.fileName} · {originalDataset.rows.length.toLocaleString()} rows
                      </span>
                    </div>
                  </label>

                  {/* Cleaned dataset */}
                  <label className={`flex items-start gap-2.5 ${!cleanedDataset ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="radio"
                      name="dataset-source"
                      value="cleaned"
                      checked={session.datasetSource === 'cleaned'}
                      onChange={() => handleDatasetSourceChange('cleaned')}
                      disabled={!cleanedDataset}
                      className="mt-0.5"
                      style={{ accentColor: 'var(--ds-primary)' }}
                    />
                    <div>
                      <span className="text-[13px] font-medium block" style={{ color: 'var(--ds-text-primary)' }}>
                        Cleaned dataset
                      </span>
                      <span className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>
                        {cleanedDataset
                          ? `${cleanedDataset.rows.length.toLocaleString()} rows after cleaning`
                          : 'Run Data Cleaning first'}
                      </span>
                    </div>
                  </label>
                </div>
              )}
            </Card>

            {/* 3. Variable selection */}
            {activeDataset && (
              <Card padding="md">
                <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--ds-text-muted)' }}>
                  3 — Select Variables
                </p>

                {session.method === 'linear-regression' ? (
                  <div className="flex flex-col gap-3">
                    {numCols.length < 2 ? (
                      <ErrorBanner message="At least 2 numeric columns are required for linear regression." />
                    ) : (
                      <>
                        <LabeledSelect
                          label="Independent variable (X)"
                          id="x-col"
                          value={session.xCol}
                          onChange={(v) => { setSession({ xCol: v }); resetResults() }}
                        >
                          <option value="">— choose column —</option>
                          {numCols.map((c) => <option key={c} value={c}>{c}</option>)}
                        </LabeledSelect>
                        <LabeledSelect
                          label="Dependent variable (Y)"
                          id="y-col"
                          value={session.yCol}
                          onChange={(v) => { setSession({ yCol: v }); resetResults() }}
                        >
                          <option value="">— choose column —</option>
                          {numCols
                            .filter((c) => c !== session.xCol)
                            .map((c) => <option key={c} value={c}>{c}</option>)}
                        </LabeledSelect>
                        {session.xCol && session.yCol && (
                          <LabeledInput
                            label="Predict Y for X ="
                            id="predict-x"
                            type="number"
                            value={session.predictX}
                            onChange={(v) => setSession({ predictX: v })}
                            placeholder="Enter a value"
                          />
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {dateCols.length === 0 ? (
                      <ErrorBanner message="No date columns detected. Ensure date values are in ISO or MM/DD/YYYY format." />
                    ) : numCols.length === 0 ? (
                      <ErrorBanner message="No numeric columns found for the target value." />
                    ) : (
                      <>
                        <LabeledSelect
                          label="Date column"
                          id="date-col"
                          value={session.dateCol}
                          onChange={(v) => { setSession({ dateCol: v }); resetResults() }}
                        >
                          <option value="">— choose date column —</option>
                          {dateCols.map((c) => <option key={c} value={c}>{c}</option>)}
                        </LabeledSelect>
                        <LabeledSelect
                          label="Target value column"
                          id="value-col"
                          value={session.valueCol}
                          onChange={(v) => { setSession({ valueCol: v }); resetResults() }}
                        >
                          <option value="">— choose value column —</option>
                          {numCols.map((c) => <option key={c} value={c}>{c}</option>)}
                        </LabeledSelect>
                        <LabeledInput
                          label="Periods to forecast (1–30)"
                          id="periods"
                          type="number"
                          min={1}
                          max={30}
                          value={String(session.periods)}
                          onChange={(v) => { setSession({ periods: Math.max(1, Math.min(30, Number(v) || 5)) }); resetResults() }}
                        />
                      </>
                    )}
                  </div>
                )}
              </Card>
            )}

            {/* Run button */}
            {activeDataset && (
              <Button
                size="lg"
                onClick={handleRunAnalysis}
                disabled={!canRun}
                className="w-full"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
                Run Analysis
              </Button>
            )}

          </div>

          {/* ── RIGHT: Results panel ───────────────────── */}
          <div className="flex-1 min-w-0">
            <Card padding="none" className="overflow-hidden">

              {/* Results header */}
              <div
                className="px-5 py-3.5 border-b flex items-center justify-between"
                style={{ borderColor: 'var(--ds-border)' }}
              >
                <span className="text-[13px] font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
                  Results
                </span>
                {(session.regressionResult !== null || session.forecastResult !== null) && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--ds-accent-light)', color: 'var(--ds-accent)' }}>
                    Analysis complete
                  </span>
                )}
              </div>

              <div className="p-5">

                {/* ── Regression results ──────────────── */}
                {session.method === 'linear-regression' && (
                  <>
                    {session.regressionResult === null && (
                      <EmptyResults method="linear-regression" />
                    )}

                    {isRegressionError(session.regressionResult) && (
                      <div className="py-8">
                        <ErrorBanner message={session.regressionResult.message} />
                      </div>
                    )}

                    {isRegressionResult(session.regressionResult) && (
                      <div className="flex flex-col gap-5" key={runKey}>

                        {/* Exclusion notice */}
                        {session.regressionResult.excludedCount > 0 && (
                          <WarningBanner messages={[
                            `${session.regressionResult.excludedCount} row${session.regressionResult.excludedCount !== 1 ? 's' : ''} excluded — missing or non-numeric values in the selected columns.`,
                          ]} />
                        )}

                        {/* Chart */}
                        <div>
                          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--ds-text-muted)' }}>
                            Scatter Plot with Fitted Regression Line
                          </p>
                          <RegressionChart
                            result={session.regressionResult}
                            xCol={session.xCol}
                            yCol={session.yCol}
                          />
                        </div>

                        {/* Stats */}
                        <div>
                          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--ds-text-muted)' }}>
                            Model Summary
                          </p>
                          <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--ds-border)' }}>
                            <div className="px-3">
                              <StatRow label="Regression equation" value={session.regressionResult.equation} />
                              <StatRow
                                label="R² (coefficient of determination)"
                                value={session.regressionResult.rSquared !== null
                                  ? session.regressionResult.rSquared.toFixed(4)
                                  : 'N/A (constant Y)'}
                              />
                              <StatRow label="Slope" value={fmt4(session.regressionResult.slope)} />
                              <StatRow label="Intercept" value={fmt4(session.regressionResult.intercept)} />
                              <StatRow label="Observations used" value={String(session.regressionResult.validRows.length)} />
                            </div>
                          </div>
                        </div>

                        {/* Prediction */}
                        {session.predictX !== '' && (
                          <div
                            className="rounded-lg p-4"
                            style={{ background: 'var(--ds-primary-light)', border: '1px solid var(--ds-primary-mid)' }}
                          >
                            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--ds-text-secondary)' }}>
                              Predicted value
                            </p>
                            {predictedY !== null ? (
                              <p className="text-[22px] font-bold font-mono" style={{ color: 'var(--ds-primary)', fontFamily: 'var(--ds-font-mono)' }}>
                                {predictedY.toFixed(4)}
                              </p>
                            ) : (
                              <p className="text-sm" style={{ color: 'var(--ds-text-muted)' }}>
                                Enter a valid number for X to see a prediction.
                              </p>
                            )}
                            {predictedY !== null && (
                              <p className="text-xs mt-1" style={{ color: 'var(--ds-text-secondary)' }}>
                                When {session.xCol} = {session.predictX}, predicted {session.yCol} = {predictedY.toFixed(4)}
                              </p>
                            )}
                            <p className="text-xs mt-2" style={{ color: 'var(--ds-text-muted)' }}>
                              This is a statistical estimate based on the fitted model, not a guaranteed outcome.
                            </p>
                          </div>
                        )}

                      </div>
                    )}
                  </>
                )}

                {/* ── Forecast results ─────────────────── */}
                {session.method === 'time-series' && (
                  <>
                    {session.forecastResult === null && (
                      <EmptyResults method="time-series" />
                    )}

                    {isForecastError(session.forecastResult) && (
                      <div className="py-8">
                        <ErrorBanner message={session.forecastResult.message} />
                      </div>
                    )}

                    {isForecastResult(session.forecastResult) && (
                      <div className="flex flex-col gap-5" key={runKey}>

                        {/* Warnings */}
                        {(session.forecastResult.warnings.length > 0 || session.forecastResult.excludedCount > 0) && (
                          <WarningBanner messages={[
                            ...(session.forecastResult.excludedCount > 0
                              ? [`${session.forecastResult.excludedCount} row${session.forecastResult.excludedCount !== 1 ? 's' : ''} excluded — invalid date or non-numeric value.`]
                              : []),
                            ...session.forecastResult.warnings,
                          ]} />
                        )}

                        {/* Chart */}
                        <div>
                          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--ds-text-muted)' }}>
                            Historical Trend &amp; Forecast
                          </p>
                          <ForecastChart
                            result={session.forecastResult}
                            valueCol={session.valueCol}
                          />
                          <p className="text-xs mt-1.5" style={{ color: 'var(--ds-text-muted)' }}>
                            Dashed line: forecast estimates. Interval: {session.forecastResult.intervalLabel}.
                          </p>
                        </div>

                        {/* Forecast table */}
                        <div>
                          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--ds-text-muted)' }}>
                            Predicted Future Values
                          </p>
                          <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--ds-border)' }}>
                            <ForecastTable result={session.forecastResult} />
                          </div>
                          <p className="text-xs mt-1.5" style={{ color: 'var(--ds-text-muted)' }}>
                            All values are linear-trend estimates and should be treated as projections, not guaranteed outcomes.
                          </p>
                        </div>

                        {/* Summary stats */}
                        <div>
                          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--ds-text-muted)' }}>
                            Forecast Summary
                          </p>
                          <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--ds-border)' }}>
                            <div className="px-3">
                              <StatRow label="Historical observations" value={String(session.forecastResult.historical.length)} />
                              <StatRow label="Forecast periods" value={String(session.forecastResult.forecast.length)} />
                              <StatRow label="Interval" value={session.forecastResult.intervalLabel} />
                              <StatRow label="Rows excluded" value={String(session.forecastResult.excludedCount)} />
                            </div>
                          </div>
                        </div>

                      </div>
                    )}
                  </>
                )}

              </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}
