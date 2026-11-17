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

type BadgeColor = 'blue' | 'yellow' | 'red' | 'green' | 'gray' | 'orange'

const issueConfig: Record<
  IssueKind,
  { label: string; color: BadgeColor; icon: React.ReactNode }
> = {
  missing_values: {
    label: 'Missing Values',
    color: 'yellow',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    ),
  },
  duplicate_rows: {
    label: 'Duplicate Rows',
    color: 'orange',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
      </svg>
    ),
  },
  whitespace: {
    label: 'Whitespace',
    color: 'blue',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  numeric_as_text: {
    label: 'Numeric as Text',
    color: 'red',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
      </svg>
    ),
  },
  inconsistent_casing: {
    label: 'Inconsistent Casing',
    color: 'blue',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
      </svg>
    ),
  },
  outliers: {
    label: 'Outliers',
    color: 'red',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
}

export function IssuePanel({
  issues,
  selectedOps,
  onOperationsChange,
  onClean,
  onReset,
}: IssuePanelProps) {
  if (issues.length === 0) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-6 py-8 text-center">
        <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-green-800">No issues found</h3>
        <p className="mt-1 text-sm text-green-600">Your dataset looks clean.</p>
        <button
          onClick={onReset}
          className="mt-4 text-sm text-green-700 underline underline-offset-2 hover:text-green-900"
        >
          ← Upload a different file
        </button>
      </div>
    )
  }

  function isOpEnabled(actionId: string): boolean {
    return selectedOps.some((op) => op.action.id === actionId && op.enabled)
  }

  function getOp(actionId: string): SelectedOperation | undefined {
    return selectedOps.find((op) => op.action.id === actionId)
  }

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

  const hasEnabled = selectedOps.some((op) => op.enabled)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Data Quality Issues</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {issues.length} issue type{issues.length !== 1 ? 's' : ''} detected. Select the
            operations you want to apply.
          </p>
        </div>
        <button
          onClick={onReset}
          className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
        >
          ← Change file
        </button>
      </div>

      {issues.map((issue) => {
        const cfg = issueConfig[issue.kind]
        return (
          <div key={issue.kind} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                cfg.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                cfg.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                cfg.color === 'red' ? 'bg-red-100 text-red-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                {cfg.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-gray-800">{cfg.label}</h3>
                  <Badge color={cfg.color}>
                    {issue.affectedCount.toLocaleString()} affected
                  </Badge>
                </div>

                <p className="mt-1 text-sm text-gray-600">{issue.explanation}</p>

                {/* Example */}
                {issue.example && (
                  <div className="mt-2 rounded-md bg-gray-50 border border-gray-100 px-3 py-1.5">
                    <p className="text-xs text-gray-400 mb-0.5">Example</p>
                    <code className="text-xs text-gray-600 break-all">{issue.example}</code>
                  </div>
                )}

                {/* Affected columns */}
                {issue.affectedColumns.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {issue.affectedColumns.map((col) => (
                      <Badge key={col} color="gray">{col}</Badge>
                    ))}
                  </div>
                )}

                {/* Actions */}
                {issue.availableActions.length === 0 ? (
                  <p className="mt-3 text-xs text-gray-400 italic">
                    Flagged for review only. No automatic action available.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {issue.availableActions.map((action, idx) => {
                      const enabled = isOpEnabled(action.id)
                      const op = getOp(action.id)
                      return (
                        <div key={action.id}>
                          <label className="flex items-center gap-2.5 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={() => toggleOp(issue, idx)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              aria-label={action.label}
                            />
                            <span className="text-sm text-gray-700 group-hover:text-gray-900">
                              {action.label}
                            </span>
                          </label>

                          {/* Fill strategy controls */}
                          {enabled && action.params?.fillStrategy !== undefined && (
                            <div className="mt-2 ml-6 flex flex-wrap items-center gap-2">
                              <label
                                htmlFor={`fill-strategy-${action.id}`}
                                className="text-xs text-gray-500"
                              >
                                Strategy:
                              </label>
                              <select
                                id={`fill-strategy-${action.id}`}
                                value={op?.action.params?.fillStrategy ?? 'median'}
                                onChange={(e) =>
                                  updateOpParam(action.id, {
                                    fillStrategy: e.target.value as 'median' | 'mean' | 'custom',
                                  })
                                }
                                className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="median">Median</option>
                                <option value="mean">Mean</option>
                                <option value="custom">Custom value</option>
                              </select>
                              {(op?.action.params?.fillStrategy ?? 'median') === 'custom' && (
                                <input
                                  type="text"
                                  placeholder="Enter value…"
                                  value={op?.action.params?.customValue ?? ''}
                                  onChange={(e) =>
                                    updateOpParam(action.id, { customValue: e.target.value })
                                  }
                                  className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
                                  aria-label="Custom fill value"
                                />
                              )}
                            </div>
                          )}

                          {/* Cap style controls */}
                          {enabled && action.params?.capStyle !== undefined && action.params.column && (
                            <div className="mt-2 ml-6 flex flex-wrap items-center gap-2">
                              <label
                                htmlFor={`cap-style-${action.id}`}
                                className="text-xs text-gray-500"
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
                                className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        )
      })}

      {/* Clean button */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          size="lg"
          onClick={onClean}
          disabled={!hasEnabled}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Clean Dataset
        </Button>
        {!hasEnabled && (
          <p className="text-xs text-gray-400">Select at least one operation to proceed.</p>
        )}
      </div>
    </div>
  )
}
