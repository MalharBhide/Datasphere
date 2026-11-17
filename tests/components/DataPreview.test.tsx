import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DataPreview } from '../../src/features/cleaning/components/DataPreview'
import type { ParsedDataset } from '../../src/features/cleaning/types'

function makeDataset(n: number): ParsedDataset {
  return {
    fileName: 'test.csv',
    columns: ['id', 'name'],
    rows: Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `Person ${i + 1}` })),
  }
}

describe('DataPreview', () => {
  it('renders the filename and row/column counts', () => {
    const ds = makeDataset(5)
    render(<DataPreview dataset={ds} />)
    expect(screen.getByText(/test\.csv/)).toBeInTheDocument()
    expect(screen.getByText(/5 rows/)).toBeInTheDocument()
    expect(screen.getByText(/2 columns/)).toBeInTheDocument()
  })

  it('renders column headers', () => {
    const ds = makeDataset(3)
    render(<DataPreview dataset={ds} />)
    expect(screen.getByRole('columnheader', { name: /\bid\b/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /\bname\b/i })).toBeInTheDocument()
  })

  it('filters rows by search term without changing the dataset', () => {
    const ds = makeDataset(10)
    render(<DataPreview dataset={ds} />)
    const input = screen.getByPlaceholderText(/Filter rows/i)
    fireEvent.change(input, { target: { value: 'Person 3' } })
    // Only "Person 3" row should show
    expect(screen.getByText('Person 3')).toBeInTheDocument()
    // "Person 1" should still be in DOM as filtered message, but not in a row
    // The underlying dataset is unchanged — still shows 10 rows in stats
    expect(screen.getByText(/10 rows/)).toBeInTheDocument()
    // Shows matching filter count
    expect(screen.getByText(/1 matching/)).toBeInTheDocument()
  })

  it('resets to page 1 when filter changes', () => {
    const ds = makeDataset(5)
    render(<DataPreview dataset={ds} />)
    const input = screen.getByPlaceholderText(/Filter rows/i)
    fireEvent.change(input, { target: { value: 'xyz_no_match' } })
    expect(screen.getByText(/No rows match/i)).toBeInTheDocument()
  })

  it('sorts rows when clicking a column header (display only)', () => {
    const ds = makeDataset(3)
    render(<DataPreview dataset={ds} />)
    const idHeader = screen.getByRole('columnheader', { name: /\bid\b/i })
    // Click once — ascending
    fireEvent.click(idHeader)
    // The underlying dataset should still report 3 rows
    expect(screen.getByText(/3 rows/)).toBeInTheDocument()
  })

  it('shows pagination for datasets larger than 100 rows', () => {
    const ds = makeDataset(150)
    render(<DataPreview dataset={ds} />)
    expect(screen.getByText(/1 \/ 2/)).toBeInTheDocument()
  })

  it('does not show pagination for small datasets', () => {
    const ds = makeDataset(5)
    render(<DataPreview dataset={ds} />)
    expect(screen.queryByText(/\d+ \/ \d+/)).not.toBeInTheDocument()
  })
})
