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

  function sortIcon(col: string) {
    if (sort.column !== col || !sort.direction) {
      return (
        <span className="ml-1 text-gray-300 text-xs" aria-hidden="true">⇅</span>
      )
    }
    return (
      <span className="ml-1 text-blue-500 text-xs" aria-hidden="true">
        {sort.direction === 'asc' ? '↑' : '↓'}
      </span>
    )
  }

  return (
    <div key={datasetKey} className="space-y-3">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-gray-600">
          <span className="font-medium text-gray-800">{dataset.fileName}</span>
          {' · '}
          <span>{dataset.rows.length.toLocaleString()} rows</span>
          {' · '}
          <span>{dataset.columns.length} columns</span>
          {filteredRows.length !== dataset.rows.length && (
            <span className="ml-2 text-blue-600">
              ({filteredRows.length.toLocaleString()} matching filter)
            </span>
          )}
        </div>

        {/* Sheet selector */}
        {dataset.sheetNames && dataset.sheetNames.length > 1 && onSheetChange && (
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="sheet-select" className="text-gray-500">Sheet:</label>
            <select
              id="sheet-select"
              value={dataset.activeSheet}
              onChange={(e) => onSheetChange(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {dataset.sheetNames.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          placeholder="Filter rows…"
          value={filter}
          onChange={handleFilterChange}
          className="w-full max-w-xs rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Filter preview rows"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10">#</th>
              {dataset.columns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 whitespace-nowrap cursor-pointer select-none hover:bg-gray-100 transition-colors"
                  onClick={() => handleHeaderClick(col)}
                  aria-sort={
                    sort.column === col
                      ? sort.direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  {col}
                  {sortIcon(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={dataset.columns.length + 1}
                  className="px-3 py-8 text-center text-sm text-gray-400"
                >
                  No rows match the current filter.
                </td>
              </tr>
            ) : (
              pageRows.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-1.5 text-xs text-gray-400 tabular-nums">
                    {(safePage - 1) * PAGE_SIZE + i + 1}
                  </td>
                  {dataset.columns.map((col) => (
                    <td
                      key={col}
                      className={`px-3 py-1.5 max-w-[200px] truncate ${
                        row[col] === null ? 'text-gray-300 italic' : 'text-gray-700'
                      }`}
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

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          Showing rows {Math.min((safePage - 1) * PAGE_SIZE + 1, sortedRows.length)}–
          {Math.min(safePage * PAGE_SIZE, sortedRows.length)} of{' '}
          {sortedRows.length.toLocaleString()}
        </p>
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
