import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CleaningResults } from '../../src/features/cleaning/components/CleaningResults'
import type { CleaningResult, ParsedDataset } from '../../src/features/cleaning/types'

// Mock download APIs
beforeEach(() => {
  global.URL.createObjectURL = vi.fn(() => 'blob:mock')
  global.URL.revokeObjectURL = vi.fn()
  const orig = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    const el = orig(tag)
    if (tag === 'a') vi.spyOn(el as HTMLAnchorElement, 'click').mockImplementation(() => undefined)
    return el
  })
})

const originalDataset: ParsedDataset = {
  fileName: 'data.csv',
  columns: ['name', 'age'],
  rows: [
    { name: ' Alice ', age: '29' },
    { name: 'Bob', age: '34' },
  ],
}

const mockResult: CleaningResult = {
  cleanedRows: [
    { name: 'Alice', age: 29 },
    { name: 'Bob', age: 34 },
  ],
  originalRowCount: 2,
  finalRowCount: 2,
  changeSummary: [
    { operation: 'Trim Whitespace', count: 1, description: 'Trimmed whitespace in 1 cell.' },
    { operation: 'Convert Numeric Text', count: 2, description: 'Converted 2 cells from text to numbers.' },
  ],
  changedCells: new Set(['0:name', '0:age', '1:age']),
}

function renderResults(overrides?: Partial<Parameters<typeof CleaningResults>[0]>) {
  const defaults = {
    result: mockResult,
    originalDataset,
    onReset: vi.fn(),
    onEditSettings: vi.fn(),
    onExportCSV: vi.fn(),
    onExportXLSX: vi.fn(),
  }
  return render(<CleaningResults {...defaults} {...overrides} />)
}

describe('CleaningResults', () => {
  it('shows the correct operation count in summary cards', () => {
    renderResults()
    expect(screen.getByText('Operations')).toBeInTheDocument()
    expect(screen.getByText('applied')).toBeInTheDocument()
  })

  it('shows each operation in the change summary', () => {
    renderResults()
    expect(screen.getByText('Trim Whitespace')).toBeInTheDocument()
    expect(screen.getByText('Convert Numeric Text')).toBeInTheDocument()
  })

  it('renders download CSV and XLSX buttons', () => {
    renderResults()
    expect(screen.getByRole('button', { name: /Download as CSV/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Download as XLSX/i })).toBeInTheDocument()
  })

  it('shows the XLSX limitation notice', () => {
    renderResults()
    expect(screen.getByText(/Original formatting/i)).toBeInTheDocument()
  })

  it('shows original and final row counts', () => {
    renderResults()
    expect(screen.getByText(/was 2/i)).toBeInTheDocument()
  })

  it('shows "no data was modified" when summary is empty', () => {
    renderResults({
      result: { ...mockResult, changeSummary: [], changedCells: new Set() },
    })
    expect(screen.getByText(/No data was modified/i)).toBeInTheDocument()
  })

  // ── Regression: Fix 3 — Edit settings back-navigation ─────────────────────

  it('renders "Edit settings" button', () => {
    renderResults()
    expect(screen.getByRole('button', { name: /Edit settings/i })).toBeInTheDocument()
  })

  it('calls onEditSettings when "Edit settings" is clicked', () => {
    const onEditSettings = vi.fn()
    renderResults({ onEditSettings })
    fireEvent.click(screen.getByRole('button', { name: /Edit settings/i }))
    expect(onEditSettings).toHaveBeenCalledOnce()
  })

  it('calls onReset when "Start over" is clicked', () => {
    const onReset = vi.fn()
    renderResults({ onReset })
    fireEvent.click(screen.getByRole('button', { name: /Start over/i }))
    expect(onReset).toHaveBeenCalledOnce()
  })
})
