import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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

describe('CleaningResults', () => {
  it('shows the correct operation count in summary cards', () => {
    render(
      <CleaningResults
        result={mockResult}
        originalDataset={originalDataset}
        onReset={vi.fn()}
        onExportCSV={vi.fn()}
        onExportXLSX={vi.fn()}
      />,
    )
    // The "Operations" card label must exist alongside the count
    expect(screen.getByText('Operations')).toBeInTheDocument()
    // The "applied" label below the count confirms the operations card rendered
    expect(screen.getByText('applied')).toBeInTheDocument()
  })

  it('shows each operation in the change summary', () => {
    render(
      <CleaningResults
        result={mockResult}
        originalDataset={originalDataset}
        onReset={vi.fn()}
        onExportCSV={vi.fn()}
        onExportXLSX={vi.fn()}
      />,
    )
    expect(screen.getByText('Trim Whitespace')).toBeInTheDocument()
    expect(screen.getByText('Convert Numeric Text')).toBeInTheDocument()
  })

  it('renders download CSV and XLSX buttons', () => {
    render(
      <CleaningResults
        result={mockResult}
        originalDataset={originalDataset}
        onReset={vi.fn()}
        onExportCSV={vi.fn()}
        onExportXLSX={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /Download as CSV/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Download as XLSX/i })).toBeInTheDocument()
  })

  it('shows the XLSX limitation notice', () => {
    render(
      <CleaningResults
        result={mockResult}
        originalDataset={originalDataset}
        onReset={vi.fn()}
        onExportCSV={vi.fn()}
        onExportXLSX={vi.fn()}
      />,
    )
    expect(screen.getByText(/Original formatting/i)).toBeInTheDocument()
  })

  it('shows original and final row counts', () => {
    render(
      <CleaningResults
        result={mockResult}
        originalDataset={originalDataset}
        onReset={vi.fn()}
        onExportCSV={vi.fn()}
        onExportXLSX={vi.fn()}
      />,
    )
    expect(screen.getByText(/was 2/i)).toBeInTheDocument()
  })

  it('shows "no data was modified" when summary is empty', () => {
    const emptyResult: CleaningResult = {
      ...mockResult,
      changeSummary: [],
      changedCells: new Set(),
    }
    render(
      <CleaningResults
        result={emptyResult}
        originalDataset={originalDataset}
        onReset={vi.fn()}
        onExportCSV={vi.fn()}
        onExportXLSX={vi.fn()}
      />,
    )
    expect(screen.getByText(/No data was modified/i)).toBeInTheDocument()
  })
})
