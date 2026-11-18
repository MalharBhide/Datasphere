import { useState } from 'react'
import { Pagination } from '../../../components/Pagination'
import { Button } from '../../../components/Button'
import { Card } from '../../../components/Card'
import type { CleaningResult, ParsedDataset, CellValue } from '../types'

const PAGE_SIZE = 100

interface CleaningResultsProps {
  result: CleaningResult
  originalDataset: ParsedDataset
  onReset: () => void
  onEditSettings: () => void
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
  onEditSettings,
  onExportCSV,
  onExportXLSX,
}: CleaningResultsProps) {
  const [page, setPage] = useState(1)
  const columns = originalDataset.columns
  const originalRows = originalDataset.rows
  const cleanedRows = result.cleanedRows
  const rowDelta = result.finalRowCount - result.originalRowCount
  const maxRows = Math.max(originalRows.length, cleanedRows.length)
  const totalPages = Math.max(1, Math.ceil(maxRows / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const origPageRows = originalRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const cleanPageRows = cleanedRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function isCellChanged(rowIdx: number, col: string): boolean {
    return result.changedCells.has(`${rowIdx}:${col}`)
  }

  return (
    <div className="space-y-6">

      {/* ── Page header ────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2
            className="text-[17px] font-semibold"
            style={{ color: 'var(--ds-text-primary)' }}
          >
            Cleaning Results
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ds-text-secondary)' }}>
            Review changes before downloading the cleaned file.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onEditSettings}
            className="text-sm cursor-pointer transition-colors duration-150 font-medium"
            style={{ color: 'var(--ds-primary)' }}
          >
            ← Edit settings
          </button>
          <button
            onClick={onReset}
            className="text-sm cursor-pointer transition-colors duration-150"
            style={{ color: 'var(--ds-text-muted)' }}
          >
            Start over
          </button>
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Rows card */}
        <Card padding="md">
          <p
            className="text-[11px] font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--ds-text-muted)' }}
          >
            Rows
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums" style={{ color: 'var(--ds-text-primary)' }}>
              {result.finalRowCount.toLocaleString()}
            </span>
            {rowDelta < 0 && (
              <span className="text-sm font-semibold" style={{ color: 'var(--ds-warning)' }}>
                −{Math.abs(rowDelta)} removed
              </span>
            )}
            {rowDelta === 0 && (
              <span className="text-sm" style={{ color: 'var(--ds-text-muted)' }}>unchanged</span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--ds-text-muted)' }}>
            was {result.originalRowCount.toLocaleString()}
          </p>
        </Card>

        {/* Cells changed card */}
        <Card padding="md">
          <p
            className="text-[11px] font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--ds-text-muted)' }}
          >
            Cells Changed
          </p>
          <span className="text-2xl font-bold tabular-nums" style={{ color: 'var(--ds-text-primary)' }}>
            {result.changedCells.size.toLocaleString()}
          </span>
          <p className="text-xs mt-0.5" style={{ color: 'var(--ds-text-muted)' }}>values modified</p>
        </Card>

        {/* Operations card */}
        <Card padding="md">
          <p
            className="text-[11px] font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--ds-text-muted)' }}
          >
            Operations
          </p>
          <span className="text-2xl font-bold tabular-nums" style={{ color: 'var(--ds-text-primary)' }}>
            {result.changeSummary.length}
          </span>
          <p className="text-xs mt-0.5" style={{ color: 'var(--ds-text-muted)' }}>applied</p>
        </Card>
      </div>

      {/* ── Change summary list ─────────────────────── */}
      {result.changeSummary.length > 0 ? (
        <Card padding="none">
          <div className="divide-y" style={{ borderColor: 'var(--ds-border)' }}>
            {result.changeSummary.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: 'var(--ds-primary)' }}
                    aria-hidden="true"
                  />
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
                    {item.operation}
                  </span>
                  <span className="text-[13px]" style={{ color: 'var(--ds-text-secondary)' }}>
                    {item.description}
                  </span>
                </div>
                <span
                  className="tabular-nums text-[13px] font-semibold"
                  style={{ color: 'var(--ds-primary)' }}
                >
                  {item.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card padding="md">
          <p className="text-sm text-center" style={{ color: 'var(--ds-text-muted)' }}>
            No data was modified by the selected operations.
          </p>
        </Card>
      )}

      {/* ── Download section ───────────────────────── */}
      <div
        className="rounded-xl p-5"
        style={{
          background: 'var(--ds-primary-light)',
          border: '1px solid var(--ds-primary-mid)',
        }}
      >
        <h3 className="text-[13px] font-semibold mb-3" style={{ color: 'var(--ds-text-primary)' }}>
          Download Cleaned File
        </h3>
        <div className="flex flex-wrap gap-3">
          <Button size="sm" onClick={onExportCSV}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download as CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={onExportXLSX}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download as XLSX
          </Button>
        </div>
        <p className="mt-2.5 text-xs" style={{ color: 'var(--ds-text-secondary)' }}>
          Exported XLSX contains only the cleaned data sheet. Original formatting and
          additional worksheets are not preserved.
        </p>
      </div>

      {/* ── Before / After comparison ───────────────── */}
      <div>
        <h3 className="text-[13px] font-semibold mb-3" style={{ color: 'var(--ds-text-primary)' }}>
          Before / After Comparison
        </h3>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Before */}
          <div>
            <p
              className="text-xs font-medium mb-2 flex items-center gap-1.5"
              style={{ color: 'var(--ds-text-secondary)' }}
            >
              <span
                className="inline-block w-2 h-2 rounded-full shrink-0"
                style={{ background: '#94A3B8' }}
                aria-hidden="true"
              />
              Before ({result.originalRowCount.toLocaleString()} rows)
            </p>
            <div
              className="overflow-x-auto rounded-xl border"
              style={{ borderColor: 'var(--ds-border)', background: 'var(--ds-surface)' }}
            >
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b" style={{ background: '#F8F9FB', borderColor: 'var(--ds-border-strong)' }}>
                    <th className="px-2.5 py-2 text-left w-8" style={{ color: 'var(--ds-text-muted)', fontSize: '11px' }}>#</th>
                    {columns.map((col) => (
                      <th
                        key={col}
                        className="px-2.5 py-2 text-left whitespace-nowrap"
                        style={{
                          color: 'var(--ds-text-secondary)',
                          fontSize: '11px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--ds-border)' }}>
                  {origPageRows.map((row, i) => (
                    <tr key={i} className="hover:bg-[#F8FAFF] transition-colors">
                      <td className="px-2.5 py-1.5 tabular-nums" style={{ color: 'var(--ds-text-muted)', fontSize: '11px' }}>
                        {(safePage - 1) * PAGE_SIZE + i + 1}
                      </td>
                      {columns.map((col) => (
                        <td
                          key={col}
                          className="px-2.5 py-1.5 max-w-[120px] truncate"
                          style={{
                            color: row[col] === null ? 'var(--ds-text-muted)' : 'var(--ds-text-primary)',
                            fontFamily: 'var(--ds-font-mono)',
                            fontSize: '12px',
                            fontStyle: row[col] === null ? 'italic' : 'normal',
                          }}
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
            <p
              className="text-xs font-medium mb-2 flex items-center gap-1.5"
              style={{ color: 'var(--ds-text-secondary)' }}
            >
              <span
                className="inline-block w-2 h-2 rounded-full shrink-0"
                style={{ background: 'var(--ds-accent)' }}
                aria-hidden="true"
              />
              After ({result.finalRowCount.toLocaleString()} rows)
              <span style={{ color: 'var(--ds-text-muted)', marginLeft: '2px' }}>
                · highlighted cells changed
              </span>
            </p>
            <div
              className="overflow-x-auto rounded-xl border"
              style={{ borderColor: 'var(--ds-border)', background: 'var(--ds-surface)' }}
            >
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b" style={{ background: '#F8F9FB', borderColor: 'var(--ds-border-strong)' }}>
                    <th className="px-2.5 py-2 text-left w-8" style={{ color: 'var(--ds-text-muted)', fontSize: '11px' }}>#</th>
                    {columns.map((col) => (
                      <th
                        key={col}
                        className="px-2.5 py-2 text-left whitespace-nowrap"
                        style={{
                          color: 'var(--ds-text-secondary)',
                          fontSize: '11px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--ds-border)' }}>
                  {cleanPageRows.map((row, i) => {
                    const absIdx = (safePage - 1) * PAGE_SIZE + i
                    return (
                      <tr key={i} className="hover:bg-[#F8FAFF] transition-colors">
                        <td className="px-2.5 py-1.5 tabular-nums" style={{ color: 'var(--ds-text-muted)', fontSize: '11px' }}>
                          {absIdx + 1}
                        </td>
                        {columns.map((col) => {
                          const changed = isCellChanged(absIdx, col)
                          return (
                            <td
                              key={col}
                              className="px-2.5 py-1.5 max-w-[120px] truncate"
                              style={{
                                background: changed ? 'var(--ds-cell-changed)' : undefined,
                                color: changed
                                  ? 'var(--ds-cell-changed-text)'
                                  : row[col] === null
                                  ? 'var(--ds-text-muted)'
                                  : 'var(--ds-text-primary)',
                                fontFamily: 'var(--ds-font-mono)',
                                fontSize: '12px',
                                fontWeight: changed ? 500 : 400,
                                fontStyle: row[col] === null && !changed ? 'italic' : 'normal',
                              }}
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
        <div className="flex items-center justify-between mt-3 px-1">
          <p className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>
            {maxRows === 0 ? '' : `Rows ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, maxRows)} of ${maxRows.toLocaleString()}`}
          </p>
          <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </div>
  )
}
