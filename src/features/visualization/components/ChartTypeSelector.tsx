/**
 * ChartTypeSelector.tsx
 *
 * Step 2 of the visualization wizard — displays all 14 chart types
 * in a grid of cards. Clicking a card selects it and advances the step.
 */
import { CHART_REGISTRY } from '../types'
import type { ChartType } from '../types'
import { Button } from '../../../components/Button'

interface ChartTypeSelectorProps {
  onSelect: (chartType: ChartType) => void
  onBack: () => void
}

// SVG icons for each chart type (18×18, same style as nav icons)
const CHART_ICONS: Record<ChartType, React.ReactNode> = {
  'bar-vertical': (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  'bar-horizontal': (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h8.25m-8.25 4.5h12.75m-12.75 4.5h6" />
    </svg>
  ),
  'bar-grouped': (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
      <rect x="3" y="10" width="3" height="11" rx="0.5" fill="currentColor" opacity="0.8"/>
      <rect x="7" y="6" width="3" height="15" rx="0.5" fill="currentColor" opacity="0.5"/>
      <rect x="13" y="8" width="3" height="13" rx="0.5" fill="currentColor" opacity="0.8"/>
      <rect x="17" y="13" width="3" height="8" rx="0.5" fill="currentColor" opacity="0.5"/>
    </svg>
  ),
  'bar-stacked': (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
      <rect x="3" y="12" width="4" height="9" rx="0.5" fill="currentColor" opacity="0.8"/>
      <rect x="3" y="6" width="4" height="6" rx="0.5" fill="currentColor" opacity="0.4"/>
      <rect x="10" y="8" width="4" height="13" rx="0.5" fill="currentColor" opacity="0.8"/>
      <rect x="10" y="4" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.4"/>
      <rect x="17" y="10" width="4" height="11" rx="0.5" fill="currentColor" opacity="0.8"/>
      <rect x="17" y="6" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.4"/>
    </svg>
  ),
  'line': (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  ),
  'area': (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22" />
      <path strokeLinecap="round" d="M2.25 21 L2.25 18 L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22 L21.75 21 Z" fill="currentColor" opacity="0.2" stroke="none"/>
    </svg>
  ),
  'pie': (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
    </svg>
  ),
  'scatter': (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
      <circle cx="6" cy="17" r="1.5" fill="currentColor"/>
      <circle cx="10" cy="12" r="1.5" fill="currentColor"/>
      <circle cx="14" cy="8" r="1.5" fill="currentColor"/>
      <circle cx="18" cy="6" r="1.5" fill="currentColor"/>
      <circle cx="8" cy="15" r="1.5" fill="currentColor" opacity="0.5"/>
      <circle cx="16" cy="10" r="1.5" fill="currentColor" opacity="0.5"/>
    </svg>
  ),
  'histogram': (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
      <rect x="2" y="13" width="4" height="8" rx="0.3" fill="currentColor" opacity="0.7"/>
      <rect x="7" y="8" width="4" height="13" rx="0.3" fill="currentColor" opacity="0.9"/>
      <rect x="12" y="10" width="4" height="11" rx="0.3" fill="currentColor" opacity="0.7"/>
      <rect x="17" y="15" width="4" height="6" rx="0.3" fill="currentColor" opacity="0.5"/>
    </svg>
  ),
  'box-plot': (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
      <rect x="8" y="8" width="8" height="8" rx="0.5" stroke="currentColor" fill="none"/>
      <line x1="12" y1="4" x2="12" y2="8" stroke="currentColor"/>
      <line x1="12" y1="16" x2="12" y2="20" stroke="currentColor"/>
      <line x1="9" y1="4" x2="15" y2="4" stroke="currentColor"/>
      <line x1="9" y1="20" x2="15" y2="20" stroke="currentColor"/>
      <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeDasharray="2"/>
    </svg>
  ),
  'heatmap-correlation': (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
      <rect x="3" y="3" width="5" height="5" rx="0.5" fill="currentColor" opacity="0.9"/>
      <rect x="9" y="3" width="5" height="5" rx="0.5" fill="currentColor" opacity="0.4"/>
      <rect x="15" y="3" width="5" height="5" rx="0.5" fill="currentColor" opacity="0.7"/>
      <rect x="3" y="9" width="5" height="5" rx="0.5" fill="currentColor" opacity="0.4"/>
      <rect x="9" y="9" width="5" height="5" rx="0.5" fill="currentColor" opacity="0.9"/>
      <rect x="15" y="9" width="5" height="5" rx="0.5" fill="currentColor" opacity="0.5"/>
      <rect x="3" y="15" width="5" height="5" rx="0.5" fill="currentColor" opacity="0.7"/>
      <rect x="9" y="15" width="5" height="5" rx="0.5" fill="currentColor" opacity="0.5"/>
      <rect x="15" y="15" width="5" height="5" rx="0.5" fill="currentColor" opacity="0.9"/>
    </svg>
  ),
  'combo-bar-line': (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
      <rect x="3" y="12" width="3" height="9" rx="0.5" fill="currentColor" opacity="0.7"/>
      <rect x="9" y="8" width="3" height="13" rx="0.5" fill="currentColor" opacity="0.7"/>
      <rect x="15" y="10" width="3" height="11" rx="0.5" fill="currentColor" opacity="0.7"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10 L9 6 L15 8 L21 4" stroke="currentColor" fill="none" strokeWidth="1.5"/>
    </svg>
  ),
  'line-multi-series': (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 17L7 11L12 14L17 8L21 10" stroke="currentColor" fill="none"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 14L7 8L12 11L17 5L21 7" stroke="currentColor" fill="none" strokeDasharray="2 1" opacity="0.6"/>
    </svg>
  ),
  'faceted': (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <rect x="2" y="2" width="9" height="9" rx="1" stroke="currentColor" fill="none"/>
      <rect x="13" y="2" width="9" height="9" rx="1" stroke="currentColor" fill="none"/>
      <rect x="2" y="13" width="9" height="9" rx="1" stroke="currentColor" fill="none"/>
      <rect x="13" y="13" width="9" height="9" rx="1" stroke="currentColor" fill="none"/>
      <path d="M4 8L6 6L8 7" stroke="currentColor" strokeLinecap="round"/>
      <path d="M15 8L17 5L19 7" stroke="currentColor" strokeLinecap="round"/>
    </svg>
  ),
}

const CATEGORY_LABELS: Record<string, string> = {
  standard: 'Standard Charts',
  statistical: 'Statistical Charts',
  advanced: 'Advanced Charts',
}

const CATEGORY_ORDER = ['standard', 'statistical', 'advanced']

export function ChartTypeSelector({ onSelect, onBack }: ChartTypeSelectorProps) {
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    types: Object.values(CHART_REGISTRY).filter((r) => r.category === cat),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={onBack}>
          ← Back
        </Button>
        <p className="text-sm" style={{ color: 'var(--ds-text-secondary)' }}>
          Select a chart type to continue
        </p>
      </div>

      {grouped.map(({ category, label, types }) => (
        <div key={category}>
          <h3
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: 'var(--ds-text-muted)' }}
          >
            {label}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {types.map((entry) => (
              <button
                key={entry.chartType}
                onClick={() => onSelect(entry.chartType)}
                className="flex flex-col items-start gap-2.5 p-4 rounded-xl border bg-white text-left transition-all duration-150 hover:border-[#3B5BDB] hover:bg-[#EEF2FF]/50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] focus:ring-offset-2"
                style={{ borderColor: 'var(--ds-border)' }}
                aria-label={`Select ${entry.displayName} chart`}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'var(--ds-primary-light)', color: 'var(--ds-primary)' }}
                >
                  {CHART_ICONS[entry.chartType]}
                </div>
                <div>
                  <p className="text-[13px] font-semibold leading-tight mb-0.5" style={{ color: 'var(--ds-text-primary)' }}>
                    {entry.displayName}
                  </p>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--ds-text-secondary)' }}>
                    {entry.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
