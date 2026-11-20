/**
 * FieldMappingPanel.tsx
 *
 * Step 3 (Configure) — dynamically renders column pickers for each field role
 * required (and optional) by the selected chart type. Filtered to column types
 * allowed per role. Shows validation errors inline.
 */
import type { ChartConfig, ColumnMeta, FieldMapping, FieldRole, FieldType } from '../types'
import { CHART_REGISTRY } from '../types'
import type { ValidationResult } from '../types'

interface FieldMappingPanelProps {
  config: ChartConfig
  columnMetas: ColumnMeta[]
  validationResult: ValidationResult
  onChange: (mapping: FieldMapping) => void
}

const ROLE_LABELS: Record<FieldRole, string> = {
  xAxis: 'X Axis',
  yAxis: 'Y Axis',
  category: 'Category',
  value: 'Value',
  series: 'Series / Group By',
  colorGroup: 'Color Group',
  measures: 'Measures (select multiple)',
  barSeries: 'Bar Series',
  lineSeries: 'Line Series',
  facetBy: 'Facet By',
}

const ROLE_DESCRIPTIONS: Partial<Record<FieldRole, string>> = {
  xAxis: 'The column shown on the horizontal axis.',
  yAxis: 'The numeric column shown on the vertical axis.',
  category: 'The column that groups the data into slices or sections.',
  value: 'The numeric column that determines the size of each slice.',
  series: 'Split data into multiple series by this column.',
  colorGroup: 'Color-code scatter points by this categorical column.',
  measures: 'Select one or more numeric columns to plot as separate series.',
  barSeries: 'The numeric column shown as bars.',
  lineSeries: 'The numeric column shown as a line.',
  facetBy: 'Create one sub-chart for each unique value of this column.',
}

function typeLabel(types: FieldType[]): string {
  return types.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(' or ')
}

function ColumnSelect({
  role,
  value,
  columnMetas,
  allowedTypes,
  required,
  onChange,
}: {
  role: FieldRole
  value?: string
  columnMetas: ColumnMeta[]
  allowedTypes: FieldType[]
  required: boolean
  onChange: (col: string | undefined) => void
}) {
  const eligible = allowedTypes.length > 0
    ? columnMetas.filter((c) => allowedTypes.includes(c.type))
    : columnMetas

  return (
    <div className="space-y-1">
      <label className="block text-[12px] font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
        {ROLE_LABELS[role]}
        {required && <span style={{ color: 'var(--ds-danger)' }} aria-label="required"> *</span>}
        {allowedTypes.length > 0 && (
          <span className="ml-1 font-normal" style={{ color: 'var(--ds-text-muted)' }}>
            ({typeLabel(allowedTypes)})
          </span>
        )}
      </label>
      {ROLE_DESCRIPTIONS[role] && (
        <p className="text-[11px]" style={{ color: 'var(--ds-text-muted)' }}>
          {ROLE_DESCRIPTIONS[role]}
        </p>
      )}
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="w-full rounded-lg border px-3 py-2 text-[13px] transition-colors duration-150 focus:outline-none focus:ring-2"
        style={{
          borderColor: 'var(--ds-border)',
          background: 'var(--ds-surface)',
          color: 'var(--ds-text-primary)',
        }}
        aria-label={`${ROLE_LABELS[role]} column picker`}
      >
        <option value="">{required ? '— Select column —' : '— None (optional) —'}</option>
        {eligible.map((c) => (
          <option key={c.name} value={c.name}>
            {c.name} ({c.type})
          </option>
        ))}
      </select>
    </div>
  )
}

function MultiColumnSelect({
  role,
  values,
  columnMetas,
  allowedTypes,
  required,
  onChange,
}: {
  role: FieldRole
  values: string[]
  columnMetas: ColumnMeta[]
  allowedTypes: FieldType[]
  required: boolean
  onChange: (cols: string[]) => void
}) {
  const eligible = allowedTypes.length > 0
    ? columnMetas.filter((c) => allowedTypes.includes(c.type))
    : columnMetas

  function toggleCol(col: string) {
    const next = values.includes(col) ? values.filter((v) => v !== col) : [...values, col]
    onChange(next)
  }

  return (
    <div className="space-y-1">
      <label className="block text-[12px] font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
        {ROLE_LABELS[role]}
        {required && <span style={{ color: 'var(--ds-danger)' }} aria-label="required"> *</span>}
        {allowedTypes.length > 0 && (
          <span className="ml-1 font-normal" style={{ color: 'var(--ds-text-muted)' }}>
            ({typeLabel(allowedTypes)})
          </span>
        )}
      </label>
      {ROLE_DESCRIPTIONS[role] && (
        <p className="text-[11px]" style={{ color: 'var(--ds-text-muted)' }}>
          {ROLE_DESCRIPTIONS[role]}
        </p>
      )}
      <div
        className="flex flex-wrap gap-2 p-2 rounded-lg border min-h-[42px]"
        style={{ borderColor: 'var(--ds-border)', background: 'var(--ds-surface)' }}
      >
        {eligible.map((c) => {
          const selected = values.includes(c.name)
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => toggleCol(c.name)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#3B5BDB]"
              style={{
                background: selected ? 'var(--ds-primary)' : 'var(--ds-primary-light)',
                color: selected ? 'white' : 'var(--ds-primary)',
              }}
              aria-pressed={selected}
              aria-label={`${selected ? 'Remove' : 'Add'} ${c.name}`}
            >
              {selected && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {c.name}
            </button>
          )
        })}
        {eligible.length === 0 && (
          <span className="text-[11px]" style={{ color: 'var(--ds-text-muted)' }}>
            No eligible columns found.
          </span>
        )}
      </div>
    </div>
  )
}

export function FieldMappingPanel({ config, columnMetas, validationResult, onChange }: FieldMappingPanelProps) {
  const registry = CHART_REGISTRY[config.chartType]
  if (!registry) return null

  const mapping = config.fieldMapping

  function update(partial: Partial<FieldMapping>) {
    onChange({ ...mapping, ...partial })
  }

  function renderRole(role: FieldRole, required: boolean) {
    const allowedTypes = (registry.roleTypeConstraints[role] ?? []) as FieldType[]

    if (role === 'measures') {
      return (
        <MultiColumnSelect
          key={role}
          role={role}
          values={mapping.measures ?? []}
          columnMetas={columnMetas}
          allowedTypes={allowedTypes}
          required={required}
          onChange={(cols) => update({ measures: cols })}
        />
      )
    }

    const value = (mapping as Record<string, string | string[] | undefined>)[role] as string | undefined
    return (
      <ColumnSelect
        key={role}
        role={role}
        value={value}
        columnMetas={columnMetas}
        allowedTypes={allowedTypes}
        required={required}
        onChange={(col) => update({ [role]: col })}
      />
    )
  }

  const allRoles = [
    ...registry.requiredRoles.map((r) => ({ role: r, required: true })),
    ...registry.optionalRoles.map((r) => ({ role: r, required: false })),
  ]

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-[13px] font-semibold mb-0.5" style={{ color: 'var(--ds-text-primary)' }}>
          Field Mapping
        </h3>
        <p className="text-[12px]" style={{ color: 'var(--ds-text-secondary)' }}>
          Assign dataset columns to chart roles. Fields marked with * are required.
        </p>
      </div>

      {allRoles.map(({ role, required }) => renderRole(role, required))}

      {/* Validation errors */}
      {validationResult.errors.length > 0 && (
        <div
          className="rounded-xl border px-4 py-3 space-y-1"
          style={{ background: 'var(--ds-danger-light)', borderColor: '#FECACA' }}
          role="alert"
        >
          <p className="text-[12px] font-semibold" style={{ color: 'var(--ds-danger)' }}>
            Fix the following before previewing:
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            {validationResult.errors.map((e, i) => (
              <li key={i} className="text-[12px]" style={{ color: 'var(--ds-danger)' }}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {validationResult.warnings.length > 0 && (
        <div
          className="rounded-xl border px-4 py-3 space-y-1"
          style={{ background: 'var(--ds-warning-light)', borderColor: '#FED7AA' }}
          role="note"
        >
          <p className="text-[12px] font-semibold" style={{ color: 'var(--ds-warning)' }}>
            Warnings:
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            {validationResult.warnings.map((w, i) => (
              <li key={i} className="text-[12px]" style={{ color: 'var(--ds-warning)' }}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
