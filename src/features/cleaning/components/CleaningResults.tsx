import { useState } from 'react'
import { Pagination } from '../../../components/Pagination'
import { Button } from '../../../components/Button'
import type { CleaningResult, ParsedDataset, CellValue } from '../types'

const PAGE_SIZE = 100

interface CleaningResultsProps {
  result: CleaningResult
  originalDataset: ParsedDataset
  onReset: () => void
  onExportCSV: () => void
  onExportXLSX: () => void
}

function cellStr(val: CellValue): string {
  if (val === null || val === undefined) return ''
  return String(val)
}

export function CleaningResults({
  result,
  originalDataset,
  onReset,
  onExportCSV,
  onExportXLSX,
}: CleaningResultsProps) {
  const [page, setPage] = useState(1)
  const columns = originalDataset.columns
  const originalRows = originalDataset.rows
  const cleanedRows = result.cleanedRows

  const rowDelta = result.finalRowCount - result.originalRowCount

  // For the side-by-side view, use the max row count
  const maxRows = Math.max(originalRows.length, cleanedRows.length)
  const totalPages = Math.max(1, Math.ceil(maxRows / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const origPageRows = originalRows.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )
  const cleanPageRows = cleanedRows.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )

  function isCellChanged(rowIdx: number, col: string): boolean {
    // changedCells uses original row indices for non-dup-removed ops,
    // but after dup removal indices shift. We store absolute cleaned indices.
    return result.changedCells.has(`${rowIdx}:${col}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Cleaning Results</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Review changes before downloading the cleaned file.
          </p>
        </div>
        <button
          onClick={onReset}
          className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
        >
          ← Start over
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Row counts */}
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rows</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {result.finalRowCount.toLocaleString()}
            </span>
            {rowDelta < 0 && (
              <span className="text-sm font-medium text-orange-600">
                −{Math.abs(rowDelta)} removed
              </span>
            )}
            {rowDelta === 0 && (
              <span className="text-sm text-gray-400">unchanged</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            was {result.originalRowCount.toLocaleString()}
          </p>
        </div>

        {/* Cells changed */}
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cells Changed</p>
          <div className="mt-1">
            <span className="text-2xl font-bold text-gray-900">
              {result.changedCells.size.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">values modified</p>
        </div>

        {/* Operations applied */}
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Operations</p>
          <div className="mt-1">
            <span className="text-2xl font-bold text-gray-900">
              {result.changeSummary.length}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">applied</p>
        </div>
      </div>

      {/* Change summary list */}
      {result.changeSummary.length > 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
          {result.changeSummary.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" aria-hidden="true" />
                <span className="text-sm font-medium text-gray-700">{item.operation}</span>
                <span className="text-sm text-gray-500">{item.description}</span>
              </div>
              <span className="tabular-nums text-sm font-semibold text-blue-700">
                {item.count.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-500 text-center">
          No data was modified by the selected operations.
        </div>
      )}

      {/* Download */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Download Cleaned File</h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" size="sm" onClick={onExportCSV}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download as CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={onExportXLSX}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download as XLSX
          </Button>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Exported XLSX contains only the cleaned data sheet. Original formatting and additional
          worksheets are not preserved.
        </p>
      </div>

      {/* Before / After comparison */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Before / After Comparison</h3>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Before */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-gray-400" aria-hidden="true" />
              Before ({result.originalRowCount.toLocaleString()} rows)
            </p>
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-2 py-1.5 text-left text-gray-400 w-8">#</th>
                    {columns.map((col) => (
                      <th key={col} className="px-2 py-1.5 text-left text-gray-500 whitespace-nowrap font-medium">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {origPageRows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-2 py-1 text-gray-300 tabular-nums">
                        {(safePage - 1) * PAGE_SIZE + i + 1}
                      </td>
                      {columns.map((col) => (
                        <td
                          key={col}
                          className={`px-2 py-1 max-w-[120px] truncate ${
                            row[col] === null ? 'text-gray-300 italic' : 'text-gray-600'
                          }`}
                          title={cellStr(row[col])}
                        >
                          {row[col] === null ? 'null' : cellStr(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* After */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500" aria-hidden="true" />
              After ({result.finalRowCount.toLocaleString()} rows)
              <span className="ml-1 text-gray-400">· highlighted cells changed</span>
            </p>
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-2 py-1.5 text-left text-gray-400 w-8">#</th>
                    {columns.map((col) => (
                      <th key={col} className="px-2 py-1.5 text-left text-gray-500 whitespace-nowrap font-medium">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cleanPageRows.map((row, i) => {
                    const absIdx = (safePage - 1) * PAGE_SIZE + i
                    return (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-2 py-1 text-gray-300 tabular-nums">
                          {absIdx + 1}
                        </td>
                        {columns.map((col) => {
                          const changed = isCellChanged(absIdx, col)
                          return (
                            <td
                              key={col}
                              className={`px-2 py-1 max-w-[120px] truncate ${
                                changed
                                  ? 'bg-yellow-50 text-yellow-800 font-medium'
                                  : row[col] === null
                                  ? 'text-gray-300 italic'
                                  : 'text-gray-600'
                              }`}
                              title={cellStr(row[col])}
                            >
                              {row[col] === null ? 'null' : cellStr(row[col])}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Shared pagination */}
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-gray-400">
            Showing rows {Math.min((safePage - 1) * PAGE_SIZE + 1, maxRows)}–
            {Math.min(safePage * PAGE_SIZE, maxRows)} of {maxRows.toLocaleString()}
          </p>
          <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </div>
  )
}
