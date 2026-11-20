/**
 * AggregationPanel.tsx
 *
 * Step 3 (Configure) — controls for aggregation method, group-by,
 * filters (column + operator + value), sort, date-range, and
 * missing-value exclusion.
 */
import { useState } from 'react'
import type { ChartConfig, ColumnMeta, TransformConfig, FilterRule, FilterOperator, SortDirection } from '../types'
import { CHART_REGISTRY } from '../types'
import { Button } from '../../../components/Button'

// Unique ID generator
let _id = 0
function nextId() { return `filter-${++_id}` }

interface AggregationPanelProps {
  config: ChartConfig
  columnMetas: ColumnMeta[]
  onChange: (transform: TransformConfig) => void
}

const AGG_METHODS = [
  { value: 'none', label: 'None (raw data)' },
  { value: 'sum', label: 'Sum' },
  { value: 'mean', label: 'Mean (average)' },
  { value: 'median', label: 'Median' },
  { value: 'count', label: 'Count' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
  { value: 'stddev', label: 'Standard Deviation' },
  { value: 'variance', label: 'Variance' },
]

const FILTER_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'eq', label: 'equals' },
  { value: 'neq', label: 'not equals' },
  { value: 'gt', label: 'greater than' },
  { value: 'lt', label: 'less than' },
  { value: 'gte', label: 'greater than or equal' },
  { value: 'lte', label: 'less than or equal' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
]

function labelStyle() {
  return 'block text-[12px] font-semibold mb-1'
}

function selectClass() {
  return 'w-full rounded-lg border px-3 py-2 text-[13px] transition-colors duration-150 focus:outline-none focus:ring-2'
}

function selectStyle() {
  return { borderColor: 'var(--ds-border)', background: 'var(--ds-surface)', color: 'var(--ds-text-primary)' }
}

export function AggregationPanel({ config, columnMetas, onChange }: AggregationPanelProps) {
  const [showFilters, setShowFilters] = useState(config.transform.filters.length > 0)
  const [showSort, setShowSort] = useState(config.transform.sortRules.length > 0)
  const [showDateRange, setShowDateRange] = useState(!!config.transform.dateRange)

  const transform = config.transform
  const registry = CHART_REGISTRY[config.chartType]
  const dateColumns = columnMetas.filter((c) => c.type === 'date')
  const hasDateCol = dateColumns.length > 0

  // Chart types that support aggregation
  const supportsAgg = !['histogram', 'box-plot', 'heatmap-correlation', 'scatter'].includes(config.chartType)
  const isHistogram = config.chartType === 'histogram'

  void registry // used in JSX

  function update(partial: Partial<TransformConfig>) {
    onChange({ ...transform, ...partial })
  }

  function addFilter() {
    const newFilter: FilterRule = {
      id: nextId(),
      column: columnMetas[0]?.name ?? '',
      operator: 'eq',
      value: '',
    }
    update({ filters: [...transform.filters, newFilter] })
  }

  function removeFilter(id: string) {
    update({ filters: transform.filters.filter((f) => f.id !== id) })
  }

  function updateFilter(id: string, patch: Partial<FilterRule>) {
    update({
      filters: transform.filters.map((f) => f.id === id ? { ...f, ...patch } : f),
    })
  }

  function addSortRule() {
    update({
      sortRules: [...transform.sortRules, { column: columnMetas[0]?.name ?? '', direction: 'asc' }],
    })
  }

  function removeSortRule(idx: number) {
    update({ sortRules: transform.sortRules.filter((_, i) => i !== idx) })
  }

  function updateSortRule(idx: number, field: 'column' | 'direction', val: string) {
    update({
      sortRules: transform.sortRules.map((s, i) =>
        i === idx ? { ...s, [field]: val as SortDirection } : s,
      ),
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-[13px] font-semibold mb-0.5" style={{ color: 'var(--ds-text-primary)' }}>
          Data Options
        </h3>
        <p className="text-[12px]" style={{ color: 'var(--ds-text-secondary)' }}>
          Aggregate, filter, and sort your data before it's charted.
        </p>
      </div>

      {/* ── Aggregation ─────────────────────────── */}
      {supportsAgg && (
        <div className="space-y-3">
          <div>
            <label className={labelStyle()} style={{ color: 'var(--ds-text-primary)' }}>Aggregation Method</label>
            <select
              value={transform.aggregation.method}
              onChange={(e) => update({ aggregation: { ...transform.aggregation, method: e.target.value as typeof transform.aggregation.method } })}
              className={selectClass()}
              style={selectStyle()}
              aria-label="Aggregation method"
            >
              {AGG_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {transform.aggregation.method !== 'none' && (
            <div>
              <label className={labelStyle()} style={{ color: 'var(--ds-text-primary)' }}>Group By</label>
              <select
                value={transform.aggregation.groupByColumn ?? ''}
                onChange={(e) => update({ aggregation: { ...transform.aggregation, groupByColumn: e.target.value || undefined } })}
                className={selectClass()}
                style={selectStyle()}
                aria-label="Group by column"
              >
                <option value="">— Select grouping column —</option>
                {columnMetas.filter((c) => c.type === 'categorical' || c.type === 'boolean').map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* ── Histogram bins ─────────────────────── */}
      {isHistogram && (
        <div className="space-y-1">
          <label className={labelStyle()} style={{ color: 'var(--ds-text-primary)' }}>
            Histogram Bins: {transform.binCount}
          </label>
          <input
            type="range"
            min={5}
            max={100}
            value={transform.binCount}
            onChange={(e) => update({ binCount: Number(e.target.value) })}
            className="w-full accent-[#3B5BDB]"
            aria-label={`Bin count: ${transform.binCount}`}
          />
          <div className="flex justify-between text-[11px]" style={{ color: 'var(--ds-text-muted)' }}>
            <span>5</span><span>100</span>
          </div>
        </div>
      )}

      {/* ── Exclude missing values ─────────────── */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={transform.excludeMissingValues}
          onChange={(e) => update({ excludeMissingValues: e.target.checked })}
          className="w-4 h-4 rounded accent-[#3B5BDB]"
          aria-label="Exclude rows with missing values"
        />
        <span className="text-[13px]" style={{ color: 'var(--ds-text-primary)' }}>
          Exclude rows with missing values
        </span>
      </label>

      {/* ── Filters ────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 text-[13px] font-semibold cursor-pointer transition-colors duration-150"
            style={{ color: 'var(--ds-text-primary)' }}
            aria-expanded={showFilters}
          >
            <svg className={['w-3.5 h-3.5 transition-transform duration-150', showFilters ? 'rotate-90' : ''].join(' ')} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            Row Filters
            {transform.filters.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#3B5BDB] text-white">
                {transform.filters.length}
              </span>
            )}
          </button>
          {showFilters && (
            <Button variant="secondary" size="sm" onClick={addFilter}>
              + Add Filter
            </Button>
          )}
        </div>

        {showFilters && transform.filters.length > 0 && (
          <div className="space-y-2">
            {transform.filters.map((filter) => (
              <div key={filter.id} className="flex items-start gap-2 p-2.5 rounded-lg border" style={{ borderColor: 'var(--ds-border)', background: 'var(--ds-bg)' }}>
                {/* Column */}
                <select
                  value={filter.column}
                  onChange={(e) => updateFilter(filter.id, { column: e.target.value })}
                  className="flex-1 rounded-lg border px-2 py-1.5 text-[12px] focus:outline-none focus:ring-1"
                  style={{ borderColor: 'var(--ds-border)', background: 'var(--ds-surface)', color: 'var(--ds-text-primary)', minWidth: 0 }}
                  aria-label="Filter column"
                >
                  {columnMetas.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>

                {/* Operator */}
                <select
                  value={filter.operator}
                  onChange={(e) => updateFilter(filter.id, { operator: e.target.value as FilterOperator })}
                  className="flex-1 rounded-lg border px-2 py-1.5 text-[12px] focus:outline-none focus:ring-1"
                  style={{ borderColor: 'var(--ds-border)', background: 'var(--ds-surface)', color: 'var(--ds-text-primary)', minWidth: 0 }}
                  aria-label="Filter operator"
                >
                  {FILTER_OPERATORS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                {/* Value */}
                <input
                  type="text"
                  value={filter.value}
                  onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                  placeholder="value"
                  className="flex-1 rounded-lg border px-2 py-1.5 text-[12px] focus:outline-none focus:ring-1"
                  style={{ borderColor: 'var(--ds-border)', background: 'var(--ds-surface)', color: 'var(--ds-text-primary)', minWidth: 0 }}
                  aria-label="Filter value"
                />

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeFilter(filter.id)}
                  className="p-1.5 rounded cursor-pointer transition-colors duration-150 hover:bg-[#FFE0E0]"
                  style={{ color: 'var(--ds-danger)' }}
                  aria-label="Remove filter"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {showFilters && transform.filters.length === 0 && (
          <p className="text-[12px]" style={{ color: 'var(--ds-text-muted)' }}>
            Click "+ Add Filter" to filter rows before charting.
          </p>
        )}
      </div>

      {/* ── Sort ───────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowSort(!showSort)}
            className="flex items-center gap-1.5 text-[13px] font-semibold cursor-pointer transition-colors duration-150"
            style={{ color: 'var(--ds-text-primary)' }}
            aria-expanded={showSort}
          >
            <svg className={['w-3.5 h-3.5 transition-transform duration-150', showSort ? 'rotate-90' : ''].join(' ')} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            Sort
            {transform.sortRules.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#3B5BDB] text-white">
                {transform.sortRules.length}
              </span>
            )}
          </button>
          {showSort && (
            <Button variant="secondary" size="sm" onClick={addSortRule}>
              + Add Sort
            </Button>
          )}
        </div>

        {showSort && transform.sortRules.length > 0 && (
          <div className="space-y-2">
            {transform.sortRules.map((rule, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={rule.column}
                  onChange={(e) => updateSortRule(idx, 'column', e.target.value)}
                  className="flex-1 rounded-lg border px-2 py-1.5 text-[12px] focus:outline-none focus:ring-1"
                  style={{ borderColor: 'var(--ds-border)', background: 'var(--ds-surface)', color: 'var(--ds-text-primary)' }}
                  aria-label={`Sort column ${idx + 1}`}
                >
                  {columnMetas.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
                <select
                  value={rule.direction}
                  onChange={(e) => updateSortRule(idx, 'direction', e.target.value)}
                  className="rounded-lg border px-2 py-1.5 text-[12px] focus:outline-none focus:ring-1"
                  style={{ borderColor: 'var(--ds-border)', background: 'var(--ds-surface)', color: 'var(--ds-text-primary)' }}
                  aria-label={`Sort direction ${idx + 1}`}
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
                <button type="button" onClick={() => removeSortRule(idx)} className="p-1.5 rounded cursor-pointer hover:bg-[#FFE0E0]" style={{ color: 'var(--ds-danger)' }} aria-label="Remove sort rule">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Date range filter ──────────────────── */}
      {hasDateCol && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowDateRange(!showDateRange)}
            className="flex items-center gap-1.5 text-[13px] font-semibold cursor-pointer transition-colors duration-150"
            style={{ color: 'var(--ds-text-primary)' }}
            aria-expanded={showDateRange}
          >
            <svg className={['w-3.5 h-3.5 transition-transform duration-150', showDateRange ? 'rotate-90' : ''].join(' ')} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            Date Range Filter
          </button>

          {showDateRange && (
            <div className="space-y-3 p-3 rounded-lg border" style={{ borderColor: 'var(--ds-border)', background: 'var(--ds-bg)' }}>
              <div>
                <label className={labelStyle()} style={{ color: 'var(--ds-text-primary)' }}>Date Column</label>
                <select
                  value={transform.dateRange?.column ?? ''}
                  onChange={(e) => update({ dateRange: { ...transform.dateRange, column: e.target.value, start: transform.dateRange?.start ?? '', end: transform.dateRange?.end ?? '' } })}
                  className={selectClass()}
                  style={selectStyle()}
                  aria-label="Date range column"
                >
                  <option value="">— Select column —</option>
                  {dateColumns.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelStyle()} style={{ color: 'var(--ds-text-primary)' }}>Start</label>
                  <input
                    type="date"
                    value={transform.dateRange?.start ?? ''}
                    onChange={(e) => update({ dateRange: { ...transform.dateRange, column: transform.dateRange?.column ?? dateColumns[0]?.name ?? '', end: transform.dateRange?.end ?? '', start: e.target.value } })}
                    className="w-full rounded-lg border px-3 py-2 text-[12px] focus:outline-none focus:ring-1"
                    style={{ borderColor: 'var(--ds-border)', background: 'var(--ds-surface)', color: 'var(--ds-text-primary)' }}
                    aria-label="Date range start"
                  />
                </div>
                <div>
                  <label className={labelStyle()} style={{ color: 'var(--ds-text-primary)' }}>End</label>
                  <input
                    type="date"
                    value={transform.dateRange?.end ?? ''}
                    onChange={(e) => update({ dateRange: { ...transform.dateRange, column: transform.dateRange?.column ?? dateColumns[0]?.name ?? '', start: transform.dateRange?.start ?? '', end: e.target.value } })}
                    className="w-full rounded-lg border px-3 py-2 text-[12px] focus:outline-none focus:ring-1"
                    style={{ borderColor: 'var(--ds-border)', background: 'var(--ds-surface)', color: 'var(--ds-text-primary)' }}
                    aria-label="Date range end"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
