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

  it('shows no extra controls when fill_median is enabled (strategy is implicit)', () => {
    const ops: SelectedOperation[] = [
      {
        action: { id: 'fill_median', label: 'Fill with median (numeric columns)', params: { fillStrategy: 'median' } },
        enabled: true,
      },
    ]
    renderPanel([missingValueIssue], ops)
    // With the new mutual-exclusion design, the strategy dropdown is gone.
    // The active selection is shown by which radio is checked.
    const medianRadio = screen.getByRole('radio', { name: /Fill with median/i })
    expect(medianRadio).toBeChecked()
    // No "Strategy:" label dropdown should appear
    expect(screen.queryByLabelText(/Strategy/i)).not.toBeInTheDocument()
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

  // ── Regression: Fix 1 — Mutually exclusive fill strategies ────────────────

  it('enabling fill_median disables fill_mean when both are present', () => {
    // Start with fill_mean enabled
    const ops: SelectedOperation[] = [
      { action: missingValueIssue.availableActions[0], enabled: false }, // fill_median
      { action: missingValueIssue.availableActions[1], enabled: true },  // fill_mean
      { action: missingValueIssue.availableActions[2], enabled: false }, // fill_custom
    ]
    const { onOpsChange } = renderPanel([missingValueIssue], ops)

    // Click the fill_median radio
    const medianRadio = screen.getByRole('radio', { name: /Fill with median/i })
    fireEvent.click(medianRadio)

    const updated: SelectedOperation[] = onOpsChange.mock.calls[0][0]
    const meanOp = updated.find((op) => op.action.id === 'fill_mean')
    const medianOp = updated.find((op) => op.action.id === 'fill_median')
    expect(medianOp?.enabled).toBe(true)
    expect(meanOp?.enabled).toBe(false)
  })

  it('enabling fill_custom disables fill_median', () => {
    const ops: SelectedOperation[] = [
      { action: missingValueIssue.availableActions[0], enabled: true },  // fill_median
      { action: missingValueIssue.availableActions[1], enabled: false }, // fill_mean
      { action: missingValueIssue.availableActions[2], enabled: false }, // fill_custom
    ]
    const { onOpsChange } = renderPanel([missingValueIssue], ops)

    const customRadio = screen.getByRole('radio', { name: /Fill with custom value/i })
    fireEvent.click(customRadio)

    const updated: SelectedOperation[] = onOpsChange.mock.calls[0][0]
    const medianOp = updated.find((op) => op.action.id === 'fill_median')
    const customOp = updated.find((op) => op.action.id === 'fill_custom')
    expect(customOp?.enabled).toBe(true)
    expect(medianOp?.enabled).toBe(false)
  })

  it('fill actions render as radio buttons, not checkboxes', () => {
    renderPanel([missingValueIssue], [])
    const radios = screen.getAllByRole('radio')
    // All three fill actions should be radio buttons
    expect(radios.length).toBeGreaterThanOrEqual(3)
  })

  // ── Regression: Fix 2 — Custom fill value validation ──────────────────────

  it('"Clean Dataset" is disabled when fill_custom is enabled but value is blank', () => {
    const ops: SelectedOperation[] = [
      {
        action: { id: 'fill_custom', label: 'Fill with custom value', params: { fillStrategy: 'custom', customValue: '' } },
        enabled: true,
      },
    ]
    renderPanel([missingValueIssue], ops)
    const btn = screen.getByRole('button', { name: /Clean Dataset/i })
    expect(btn).toBeDisabled()
  })

  it('"Clean Dataset" is disabled when fill_custom value is whitespace only', () => {
    const ops: SelectedOperation[] = [
      {
        action: { id: 'fill_custom', label: 'Fill with custom value', params: { fillStrategy: 'custom', customValue: '   ' } },
        enabled: true,
      },
    ]
    renderPanel([missingValueIssue], ops)
    const btn = screen.getByRole('button', { name: /Clean Dataset/i })
    expect(btn).toBeDisabled()
  })

  it('"Clean Dataset" is enabled when fill_custom has value "0"', () => {
    const ops: SelectedOperation[] = [
      {
        action: { id: 'fill_custom', label: 'Fill with custom value', params: { fillStrategy: 'custom', customValue: '0' } },
        enabled: true,
      },
    ]
    renderPanel([missingValueIssue], ops)
    const btn = screen.getByRole('button', { name: /Clean Dataset/i })
    expect(btn).not.toBeDisabled()
  })

  it('shows inline error when fill_custom is enabled but blank', () => {
    const ops: SelectedOperation[] = [
      {
        action: { id: 'fill_custom', label: 'Fill with custom value', params: { fillStrategy: 'custom', customValue: '' } },
        enabled: true,
      },
    ]
    renderPanel([missingValueIssue], ops)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(/Enter a fill value/i)
  })
})
