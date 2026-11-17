import { useState, useMemo, type ChangeEvent } from 'react'
import { Pagination } from '../../../components/Pagination'
import type { ParsedDataset, CellValue } from '../types'

const PAGE_SIZE = 100

type SortDir = 'asc' | 'desc' | null

interface SortState {
  column: string
  direction: SortDir
}

interface DataPreviewProps {
  dataset: ParsedDataset
  onSheetChange?: (sheetName: string) => void
}

function cellStr(val: CellValue): string {
  if (val === null || val === undefined) return ''
  return String(val)
}

function compareValues(a: CellValue, b: CellValue): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })
}

function SortIcon({ col, sort }: { col: string; sort: SortState }) {
  const isActive = sort.column === col && sort.direction !== null
  return (
    <span
      className={['ml-1 text-[10px] select-none', isActive ? 'text-[#3B5BDB]' : 'text-slate-300'].join(' ')}
      aria-hidden="true"
    >
      {isActive ? (sort.direction === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  )
}

export function DataPreview({ dataset, onSheetChange }: DataPreviewProps) {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('')
  const [sort, setSort] = useState<SortState>({ column: '', direction: null })

  // Reset page when dataset changes
  const datasetKey = dataset.fileName + (dataset.activeSheet ?? '')

  // Filtered rows (display only — never modifies dataset)
  const filteredRows = useMemo(() => {
    if (!filter.trim()) return dataset.rows
    const q = filter.toLowerCase()
    return dataset.rows.filter((row) =>
      dataset.columns.some((col) => cellStr(row[col]).toLowerCase().includes(q)),
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset, filter])

  // Sorted rows (display only)
  const sortedRows = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredRows
    const col = sort.column
    const dir = sort.direction
    return [...filteredRows].sort((a, b) => {
      const cmp = compareValues(a[col], b[col])
      return dir === 'asc' ? cmp : -cmp
    })
  }, [filteredRows, sort])

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = sortedRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function handleFilterChange(e: ChangeEvent<HTMLInputElement>) {
    setFilter(e.target.value)
    setPage(1)
  }

  function handleHeaderClick(col: string) {
    setSort((prev) => {
      if (prev.column !== col) return { column: col, direction: 'asc' }
      if (prev.direction === 'asc') return { column: col, direction: 'desc' }
      return { column: '', direction: null }
    })
    setPage(1)
  }

  return (
    <div key={datasetKey} className="space-y-3">
      {/* ── Toolbar ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Stats */}
        <div className="flex items-center gap-3 text-[13px]">
          <span
            className="font-medium"
            style={{ color: 'var(--ds-text-primary)', fontFamily: 'var(--ds-font-mono)' }}
          >
            {dataset.fileName}
          </span>
          <span className="h-3.5 w-px" style={{ background: 'var(--ds-border-strong)' }} aria-hidden="true" />
          <span style={{ color: 'var(--ds-text-secondary)' }}>
            {dataset.rows.length.toLocaleString()} rows
          </span>
          <span style={{ color: 'var(--ds-text-muted)' }}>·</span>
          <span style={{ color: 'var(--ds-text-secondary)' }}>
            {dataset.columns.length} columns
          </span>
          {filteredRows.length !== dataset.rows.length && (
            <span
              className="rounded px-1.5 py-0.5 text-xs font-medium"
              style={{ background: 'var(--ds-primary-light)', color: 'var(--ds-primary)' }}
            >
              {filteredRows.length.toLocaleString()} matching
            </span>
          )}
        </div>

        {/* Sheet selector + filter */}
        <div className="flex items-center gap-2">
          {dataset.sheetNames && dataset.sheetNames.length > 1 && onSheetChange && (
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="sheet-select"
                className="text-xs"
                style={{ color: 'var(--ds-text-muted)' }}
              >
                Sheet
              </label>
              <select
                id="sheet-select"
                value={dataset.activeSheet}
                onChange={(e) => onSheetChange(e.target.value)}
                className="h-8 rounded-lg border px-2.5 text-[13px] transition-colors duration-150 cursor-pointer"
                style={{
                  borderColor: 'var(--ds-border-strong)',
                  background: 'var(--ds-surface)',
                  color: 'var(--ds-text-primary)',
                }}
              >
                {dataset.sheetNames.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          {/* Filter input */}
          <div className="relative">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
              style={{ color: 'var(--ds-text-muted)' }}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder="Filter rows…"
              value={filter}
              onChange={handleFilterChange}
              className="h-8 w-48 rounded-lg border pl-8 pr-3 text-[13px] transition-colors duration-150"
              style={{
                borderColor: 'var(--ds-border-strong)',
                background: 'var(--ds-surface)',
                color: 'var(--ds-text-primary)',
              }}
              aria-label="Filter preview rows"
            />
          </div>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────── */}
      <div
        className="overflow-x-auto rounded-xl border"
        style={{ borderColor: 'var(--ds-border)', background: 'var(--ds-surface)' }}
      >
        <table className="min-w-full text-[13px]">
          <thead>
            <tr
              className="border-b"
              style={{ background: '#F8F9FB', borderColor: 'var(--ds-border-strong)' }}
            >
              <th
                className="px-3 py-2.5 text-left w-10"
                style={{ color: 'var(--ds-text-muted)', fontSize: '11px' }}
              >
                #
              </th>
              {dataset.columns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2.5 text-left whitespace-nowrap cursor-pointer select-none transition-colors duration-150 hover:bg-slate-100"
                  onClick={() => handleHeaderClick(col)}
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--ds-text-secondary)',
                  }}
                  aria-sort={
                    sort.column === col
                      ? sort.direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  {col}
                  <SortIcon col={col} sort={sort} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--ds-border)' }}>
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={dataset.columns.length + 1}
                  className="px-3 py-10 text-center text-sm"
                  style={{ color: 'var(--ds-text-muted)' }}
                >
                  No rows match the current filter.
                </td>
              </tr>
            ) : (
              pageRows.map((row, i) => (
                <tr
                  key={i}
                  className="transition-colors duration-100 hover:bg-[#F8FAFF]"
                >
                  <td
                    className="px-3 py-2 text-[11px] tabular-nums"
                    style={{ color: 'var(--ds-text-muted)' }}
                  >
                    {(safePage - 1) * PAGE_SIZE + i + 1}
                  </td>
                  {dataset.columns.map((col) => (
                    <td
                      key={col}
                      className="px-3 py-2 max-w-[180px] truncate"
                      style={{
                        color: row[col] === null ? 'var(--ds-text-muted)' : 'var(--ds-text-primary)',
                        fontFamily: 'var(--ds-font-mono)',
                        fontSize: '13px',
                        fontStyle: row[col] === null ? 'italic' : 'normal',
                        fontWeight: 400,
                      }}
                      title={cellStr(row[col])}
                    >
                      {row[col] === null ? 'null' : cellStr(row[col])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination footer ─────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>
          {sortedRows.length === 0
            ? 'No results'
            : `Showing ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, sortedRows.length)} of ${sortedRows.length.toLocaleString()}`}
        </p>
        <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  )
}
