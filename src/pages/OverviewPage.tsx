import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'

const features = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
    label: 'Upload CSV or XLSX',
    desc: 'Drag & drop files or browse. Auto-detect encoding and sheets.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
      </svg>
    ),
    label: 'Detect 6 Issue Types',
    desc: 'Missing values, duplicates, whitespace, type errors, casing, outliers.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
      </svg>
    ),
    label: 'Targeted Cleaning',
    desc: 'Select only the operations you need. Full control, no guessing.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
    label: 'Before / After',
    desc: 'Side-by-side comparison with changed cells highlighted.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
    label: 'Download CSV or XLSX',
    desc: 'Export the cleaned file in your preferred format.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    label: '14 Chart Types',
    desc: 'Bar, line, area, pie, scatter, histogram, box plot, heatmap, and more.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    label: '100% Client-Side',
    desc: 'No data leaves your browser. No accounts, no cloud storage.',
  },
]

export function OverviewPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-full" style={{ background: 'var(--ds-bg)' }}>
      {/* ── Page header ──────────────────────────── */}
      <div className="px-6 py-8 max-w-[1200px] mx-auto">

        {/* Hero block */}
        <div className="flex flex-col items-start gap-6 mb-10 max-w-2xl">
          {/* Eyebrow */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-semibold text-[#3B5BDB]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B5BDB]" aria-hidden="true" />
            Version 1.1 — Data Cleaning &amp; Visualization
          </span>

          {/* Heading */}
          <div>
            <h1 className="text-[28px] font-bold leading-tight tracking-tight" style={{ color: 'var(--ds-text-primary)' }}>
              Your data workspace,
              <br />
              <span style={{ color: 'var(--ds-primary)' }}>clean and in control.</span>
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: 'var(--ds-text-secondary)' }}>
              Datasphere is a browser-based data platform. Clean your data, then visualize it
              with 14 chart types, full statistical analysis, and PNG/SVG export — all in your
              browser, without installing anything or sharing your data.
            </p>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button size="lg" onClick={() => navigate('/clean')}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
              Start Cleaning Data
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/visualize')}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              Explore Visualizations
            </Button>
            <span className="text-sm" style={{ color: 'var(--ds-text-muted)' }}>
              No sign-up required
            </span>
          </div>
        </div>

        {/* ── Divider ─────────────────────────────── */}
        <div className="border-t mb-8" style={{ borderColor: 'var(--ds-border)' }} />

        {/* ── Feature grid ─────────────────────────── */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: 'var(--ds-text-muted)' }}>
            What Datasphere does
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex items-start gap-3 p-4 rounded-xl bg-white border"
                style={{ borderColor: 'var(--ds-border)' }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'var(--ds-primary-light)', color: 'var(--ds-primary)' }}
                >
                  {f.icon}
                </div>
                <div>
                  <p className="text-[13px] font-semibold mb-0.5" style={{ color: 'var(--ds-text-primary)' }}>
                    {f.label}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--ds-text-secondary)' }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Workflow steps ───────────────────────── */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: 'var(--ds-text-muted)' }}>
            How it works
          </h2>
          <div className="flex flex-wrap gap-2 items-center">
            {['Upload', 'Preview', 'Detect Issues', 'Configure', 'Clean', 'Download'].map((step, i, arr) => (
              <div key={step} className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border text-[13px] font-medium" style={{ borderColor: 'var(--ds-border)', color: 'var(--ds-text-secondary)' }}>
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: 'var(--ds-primary)' }}
                  >
                    {i + 1}
                  </span>
                  {step}
                </div>
                {i < arr.length - 1 && (
                  <svg className="w-3 h-3 shrink-0" style={{ color: 'var(--ds-text-muted)' }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom CTA card ──────────────────────── */}
        <div
          className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ background: 'var(--ds-primary-light)', border: `1px solid var(--ds-primary-mid)` }}
        >
          <div>
            <p className="text-[15px] font-semibold" style={{ color: 'var(--ds-primary)' }}>
              Ready to clean your first dataset?
            </p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--ds-text-secondary)' }}>
              Try the built-in sample dataset to see how it works in under a minute.
            </p>
          </div>
          <Button size="md" onClick={() => navigate('/clean')}>
            Open Data Cleaning →
          </Button>
        </div>
      </div>
    </div>
  )
}
