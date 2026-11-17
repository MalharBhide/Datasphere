import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { IssuePanel } from '../../src/features/cleaning/components/IssuePanel'
import type { DetectedIssue, SelectedOperation } from '../../src/features/cleaning/types'

const missingValueIssue: DetectedIssue = {
  kind: 'missing_values',
  affectedCount: 3,
  affectedColumns: ['salary'],
  explanation: '3 cells are empty or null.',
  example: 'Column "salary" has an empty cell',
  availableActions: [
    { id: 'fill_median', label: 'Fill with median (numeric columns)', params: { fillStrategy: 'median' } },
    { id: 'fill_mean', label: 'Fill with mean (numeric columns)', params: { fillStrategy: 'mean' } },
    { id: 'fill_custom', label: 'Fill with custom value', params: { fillStrategy: 'custom', customValue: '' } },
  ],
}

const duplicateIssue: DetectedIssue = {
  kind: 'duplicate_rows',
  affectedCount: 1,
  affectedColumns: [],
  explanation: '1 duplicate row found.',
  example: '{name: Bob}',
  availableActions: [{ id: 'remove_duplicates', label: 'Remove duplicate rows' }],
}

function renderPanel(
  issues: DetectedIssue[] = [missingValueIssue],
  ops: SelectedOperation[] = [],
) {
  const onOpsChange = vi.fn()
  const onClean = vi.fn()
  const onReset = vi.fn()
  const utils = render(
    <IssuePanel
      issues={issues}
      selectedOps={ops}
      onOperationsChange={onOpsChange}
      onClean={onClean}
      onReset={onReset}
    />,
  )
  return { ...utils, onOpsChange, onClean, onReset }
}

describe('IssuePanel', () => {
  it('renders issue cards for each detected issue', () => {
    renderPanel([missingValueIssue, duplicateIssue])
    expect(screen.getByText('Missing Values')).toBeInTheDocument()
    expect(screen.getByText('Duplicate Rows')).toBeInTheDocument()
  })

  it('shows "No issues found" when issues array is empty', () => {
    renderPanel([])
    expect(screen.getByText(/No issues found/i)).toBeInTheDocument()
  })

  it('"Clean Dataset" button is disabled when no operations are selected', () => {
    renderPanel([missingValueIssue], [])
    const btn = screen.getByRole('button', { name: /Clean Dataset/i })
    expect(btn).toBeDisabled()
  })

  it('"Clean Dataset" button is enabled when at least one operation is enabled', () => {
    const ops: SelectedOperation[] = [
      { action: missingValueIssue.availableActions[0], enabled: true },
    ]
    renderPanel([missingValueIssue], ops)
    const btn = screen.getByRole('button', { name: /Clean Dataset/i })
    expect(btn).not.toBeDisabled()
  })

  it('calls onClean when Clean Dataset is clicked and ops are selected', () => {
    const ops: SelectedOperation[] = [
      { action: missingValueIssue.availableActions[0], enabled: true },
    ]
    const { onClean } = renderPanel([missingValueIssue], ops)
    fireEvent.click(screen.getByRole('button', { name: /Clean Dataset/i }))
    expect(onClean).toHaveBeenCalledOnce()
  })

  it('shows fill strategy dropdown when a fill action is enabled', () => {
    const ops: SelectedOperation[] = [
      {
        action: { id: 'fill_median', label: 'Fill with median (numeric columns)', params: { fillStrategy: 'median' } },
        enabled: true,
      },
    ]
    renderPanel([missingValueIssue], ops)
    // Strategy dropdown should be visible
    expect(screen.getByLabelText(/Strategy/i)).toBeInTheDocument()
  })

  it('shows custom value input when strategy is custom', () => {
    const ops: SelectedOperation[] = [
      {
        action: { id: 'fill_custom', label: 'Fill with custom value', params: { fillStrategy: 'custom', customValue: '' } },
        enabled: true,
      },
    ]
    renderPanel([missingValueIssue], ops)
    expect(screen.getByLabelText(/Custom fill value/i)).toBeInTheDocument()
  })

  it('calls onReset when "Change file" is clicked', () => {
    const { onReset } = renderPanel([missingValueIssue])
    fireEvent.click(screen.getByText(/Change file/i))
    expect(onReset).toHaveBeenCalledOnce()
  })
})
