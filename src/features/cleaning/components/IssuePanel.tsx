import type { DetectedIssue, IssueKind, SelectedOperation } from '../types'
import { Badge } from '../../../components/Badge'
import { Button } from '../../../components/Button'

interface IssuePanelProps {
  issues: DetectedIssue[]
  selectedOps: SelectedOperation[]
  onOperationsChange: (ops: SelectedOperation[]) => void
  onClean: () => void
  onReset: () => void
}

// ── Issue kind configuration ───────────────────────────────────────────────

type IssueVariant = 'warning' | 'orange' | 'info' | 'violet' | 'teal' | 'danger'

interface IssueConfig {
  label: string
  color: string        // left-border and icon color
  badgeVariant: IssueVariant
  icon: React.ReactNode
}

const issueConfig: Record<IssueKind, IssueConfig> = {
  missing_values: {
    label: 'Missing Values',
    color: '#E67700',
    badgeVariant: 'warning',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    ),
  },
  duplicate_rows: {
    label: 'Duplicate Rows',
    color: '#E8590C',
    badgeVariant: 'orange',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
      </svg>
    ),
  },
  whitespace: {
    label: 'Whitespace',
    color: '#1971C2',
    badgeVariant: 'info',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  numeric_as_text: {
    label: 'Numeric as Text',
    color: '#6741D9',
    badgeVariant: 'violet',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
      </svg>
    ),
  },
  inconsistent_casing: {
    label: 'Inconsistent Casing',
    color: '#0F9B8E',
    badgeVariant: 'teal',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
      </svg>
    ),
  },
  outliers: {
    label: 'Outliers',
    color: '#D63939',
    badgeVariant: 'danger',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
}

// IDs that belong to the mutually exclusive fill-strategy group.
const FILL_ACTION_IDS = new Set(['fill_median', 'fill_mean', 'fill_custom'])

// ── IssuePanel component ───────────────────────────────────────────────────

export function IssuePanel({
  issues,
  selectedOps,
  onOperationsChange,
  onClean,
  onReset,
}: IssuePanelProps) {

  // ── No issues ──────────────────────────────────────

  if (issues.length === 0) {
    return (
      <div
        className="rounded-xl border px-6 py-10 text-center"
        style={{ background: 'var(--ds-accent-light)', borderColor: '#6EE7B7' }}
      >
        <div
          className="mx-auto mb-3 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: '#D1FAE5' }}
        >
          <svg className="w-5 h-5 text-[#0CA678]" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-[#065F46]">No issues found</h3>
        <p className="mt-1 text-sm text-[#059669]">Your dataset looks clean.</p>
        <button
          onClick={onReset}
          className="mt-4 text-sm text-[#065F46] underline underline-offset-2 hover:text-[#047857] cursor-pointer"
        >
          ← Upload a different file
        </button>
      </div>
    )
  }

  // ── Helpers ────────────────────────────────────────

  function isOpEnabled(actionId: string): boolean {
    return selectedOps.some((op) => op.action.id === actionId && op.enabled)
  }

  function getOp(actionId: string): SelectedOperation | undefined {
    return selectedOps.find((op) => op.action.id === actionId)
  }

  /**
   * Toggle a non-fill action on/off (standard checkbox behaviour).
   */
  function toggleOp(issue: DetectedIssue, actionIndex: number) {
    const action = issue.availableActions[actionIndex]
    const existing = getOp(action.id)
    if (existing) {
      onOperationsChange(
        selectedOps.map((op) =>
          op.action.id === action.id ? { ...op, enabled: !op.enabled } : op,
        ),
      )
    } else {
      onOperationsChange([...selectedOps, { action, enabled: true }])
    }
  }

  /**
   * Select a fill strategy action — enforces mutual exclusion by disabling all
   * other fill actions in the same issue before enabling the chosen one.
   * If the chosen action is already enabled, clicking it disables it (deselect).
   */
  function selectFillOp(issue: DetectedIssue, actionIndex: number) {
    const chosen = issue.availableActions[actionIndex]
    const siblingIds = new Set(
      issue.availableActions
        .filter((a) => FILL_ACTION_IDS.has(a.id))
        .map((a) => a.id),
    )
    const chosenIsCurrentlyEnabled = isOpEnabled(chosen.id)

    // Build the updated ops list:
    //  • All siblings get disabled
    //  • The chosen one toggles (enable if not currently enabled, disable if it was)
    let updatedOps = selectedOps.map((op) => {
      if (siblingIds.has(op.action.id)) {
        return { ...op, enabled: op.action.id === chosen.id ? !chosenIsCurrentlyEnabled : false }
      }
      return op
    })

    // If the chosen action wasn't in selectedOps at all, add it
    const chosenExists = selectedOps.some((op) => op.action.id === chosen.id)
    if (!chosenExists) {
      // Also ensure all existing siblings are disabled
      updatedOps = updatedOps.map((op) =>
        siblingIds.has(op.action.id) && op.action.id !== chosen.id
          ? { ...op, enabled: false }
          : op,
      )
      updatedOps = [...updatedOps, { action: chosen, enabled: true }]
    }

    onOperationsChange(updatedOps)
  }

  function updateOpParam(
    actionId: string,
    params: Partial<NonNullable<SelectedOperation['action']['params']>>,
  ) {
    onOperationsChange(
      selectedOps.map((op) =>
        op.action.id === actionId
          ? { ...op, action: { ...op.action, params: { ...op.action.params, ...params } } }
          : op,
      ),
    )
  }

  // ── Validation ─────────────────────────────────────

  // Determine whether the custom fill value is invalid (enabled but blank)
  const customFillOp = getOp('fill_custom')
  const customFillEnabled = isOpEnabled('fill_custom')
  const customFillValue = customFillOp?.action.params?.customValue ?? ''
  const customFillInvalid = customFillEnabled && customFillValue.trim() === ''

  const hasEnabled = selectedOps.some((op) => op.enabled)
  const canClean = hasEnabled && !customFillInvalid

  return (
    <div className="space-y-4">
      {/* ── Section header ─────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[17px] font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
            Data Quality Issues
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ds-text-secondary)' }}>
            {issues.length} issue type{issues.length !== 1 ? 's' : ''} detected.
            Select the operations you want to apply.
          </p>
        </div>
        <button
          onClick={onReset}
          className="text-sm cursor-pointer transition-colors duration-150"
          style={{ color: 'var(--ds-text-muted)' }}
        >
          ← Change file
        </button>
      </div>

      {/* ── Issue cards ────────────────────────────── */}
      {issues.map((issue) => {
        const cfg = issueConfig[issue.kind]
        // Determine if this issue uses mutually exclusive fill actions
        const isFillIssue = issue.availableActions.some((a) => FILL_ACTION_IDS.has(a.id))

        return (
          <div
            key={issue.kind}
            className="rounded-xl bg-white overflow-hidden"
            style={{
              border: '1px solid var(--ds-border)',
              borderLeft: `4px solid ${cfg.color}`,
              boxShadow: 'var(--ds-shadow-card)',
            }}
          >
            <div className="p-5">
              {/* Card header */}
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: `${cfg.color}18`, color: cfg.color }}
                >
                  {cfg.icon}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Title row */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-[13px] font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
                      {cfg.label}
                    </h3>
                    <Badge variant={cfg.badgeVariant}>
                      {issue.affectedCount.toLocaleString()} affected
                    </Badge>
                  </div>

                  {/* Explanation */}
                  <p className="text-[13px] leading-relaxed" style={{ color: 'var(--ds-text-secondary)' }}>
                    {issue.explanation}
                  </p>

                  {/* Example */}
                  {issue.example && (
                    <div
                      className="mt-2.5 rounded-lg border px-3 py-2"
                      style={{ background: '#F8F9FB', borderColor: 'var(--ds-border)' }}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--ds-text-muted)' }}>
                        Example
                      </p>
                      <code
                        className="text-[12px] break-all"
                        style={{ color: 'var(--ds-text-primary)', fontFamily: 'var(--ds-font-mono)' }}
                      >
                        {issue.example}
                      </code>
                    </div>
                  )}

                  {/* Affected columns */}
                  {issue.affectedColumns.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {issue.affectedColumns.map((col) => (
                        <Badge key={col} variant="neutral">{col}</Badge>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  {issue.availableActions.length === 0 ? (
                    <p
                      className="mt-3 text-xs italic"
                      style={{ color: 'var(--ds-text-muted)' }}
                    >
                      Flagged for review only — no automatic action available.
                    </p>
                  ) : (
                    <div className="mt-3.5 space-y-2.5">
                      {issue.availableActions.map((action, idx) => {
                        const isFillAction = FILL_ACTION_IDS.has(action.id)
                        const enabled = isOpEnabled(action.id)
                        const op = getOp(action.id)

                        // For fill actions: use radio-style mutual exclusion.
                        // For all other actions: standard checkbox toggle.
                        const handleToggle = isFillAction
                          ? () => selectFillOp(issue, idx)
                          : () => toggleOp(issue, idx)

                        // Show custom fill value error only on the fill_custom action
                        const showCustomError =
                          action.id === 'fill_custom' && customFillInvalid

                        return (
                          <div key={action.id}>
                            <label className="flex items-center gap-2.5 cursor-pointer group">
                              <input
                                type={isFillIssue ? 'radio' : 'checkbox'}
                                name={isFillIssue ? `fill-strategy-${issue.kind}` : undefined}
                                checked={enabled}
                                onChange={handleToggle}
                                className="w-4 h-4 rounded border-[#CBD5E1] text-[#3B5BDB] focus:ring-[#3B5BDB] cursor-pointer"
                                aria-label={action.label}
                              />
                              <span
                                className="text-[13px] font-medium transition-colors duration-150"
                                style={{ color: enabled ? 'var(--ds-text-primary)' : 'var(--ds-text-secondary)' }}
                              >
                                {action.label}
                              </span>
                            </label>

                            {/* Fill strategy sub-controls (strategy selector lives on the action row itself,
                                so only one is visible at a time thanks to mutual exclusion) */}
                            {enabled && action.params?.fillStrategy !== undefined && (
                              <div className="mt-2 ml-6.5 flex flex-wrap items-center gap-2">
                                {/* For fill_custom, show only the value input (strategy is implicit) */}
                                {action.id === 'fill_custom' ? (
                                  <>
                                    <input
                                      type="text"
                                      placeholder="Enter value…"
                                      value={op?.action.params?.customValue ?? ''}
                                      onChange={(e) =>
                                        updateOpParam(action.id, { customValue: e.target.value })
                                      }
                                      className="h-7 rounded-lg border px-2.5 text-xs w-36 transition-colors"
                                      style={{
                                        borderColor: showCustomError ? '#D63939' : 'var(--ds-border-strong)',
                                        background: 'var(--ds-surface)',
                                        color: 'var(--ds-text-primary)',
                                      }}
                                      aria-label="Custom fill value"
                                      aria-invalid={showCustomError}
                                      aria-describedby={showCustomError ? 'custom-fill-error' : undefined}
                                    />
                                    {showCustomError && (
                                      <span
                                        id="custom-fill-error"
                                        role="alert"
                                        className="text-xs font-medium"
                                        style={{ color: '#D63939' }}
                                      >
                                        Enter a fill value.
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  /* For fill_median / fill_mean: no extra controls needed —
                                     the strategy is implied by which action is selected. */
                                  null
                                )}
                              </div>
                            )}

                            {/* Cap style controls */}
                            {enabled && action.params?.capStyle !== undefined && action.params.column && (
                              <div className="mt-2 ml-6.5 flex flex-wrap items-center gap-2">
                                <label
                                  htmlFor={`cap-style-${action.id}`}
                                  className="text-xs"
                                  style={{ color: 'var(--ds-text-muted)' }}
                                >
                                  Style:
                                </label>
                                <select
                                  id={`cap-style-${action.id}`}
                                  value={op?.action.params?.capStyle ?? 'title'}
                                  onChange={(e) =>
                                    updateOpParam(action.id, {
                                      capStyle: e.target.value as 'title' | 'upper' | 'lower',
                                    })
                                  }
                                  className="h-7 rounded-lg border px-2.5 text-xs cursor-pointer"
                                  style={{
                                    borderColor: 'var(--ds-border-strong)',
                                    background: 'var(--ds-surface)',
                                    color: 'var(--ds-text-primary)',
                                  }}
                                >
                                  <option value="title">Title Case</option>
                                  <option value="upper">UPPERCASE</option>
                                  <option value="lower">lowercase</option>
                                </select>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* ── Bottom action bar ──────────────────────── */}
      <div
        className="flex items-center gap-4 pt-2 pb-1"
        style={{ borderTop: '1px solid var(--ds-border)' }}
      >
        <Button size="lg" onClick={onClean} disabled={!canClean}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
          </svg>
          Clean Dataset
        </Button>
        {!hasEnabled && (
          <p className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>
            Select at least one operation to proceed.
          </p>
        )}
        {customFillInvalid && (
          <p className="text-xs font-medium" style={{ color: '#D63939' }}>
            Enter a custom fill value to proceed.
          </p>
        )}
      </div>
    </div>
  )
}
