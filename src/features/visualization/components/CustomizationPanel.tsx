/**
 * CustomizationPanel.tsx
 *
 * Step 4 (Customize) — controls for titles, axis labels, colors,
 * scale, legend, number formatting, and display options.
 * Live preview updates as users change values.
 */
import { Card } from '../../../components/Card'
import type { ChartCustomization, ColorPaletteName, AxisScaleType, LegendPosition, NumberFormat } from '../types'
import { COLOR_PALETTES } from '../types'

interface CustomizationPanelProps {
  customization: ChartCustomization
  chartType: string
  onChange: (c: ChartCustomization) => void
}

function inputClass() {
  return 'w-full rounded-lg border px-3 py-2 text-[13px] transition-colors duration-150 focus:outline-none focus:ring-2'
}
function inputStyle() {
  return { borderColor: 'var(--ds-border)', background: 'var(--ds-surface)', color: 'var(--ds-text-primary)' }
}
function labelClass() {
  return 'block text-[12px] font-semibold mb-1'
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--ds-text-muted)' }}>
      {children}
    </p>
  )
}

export function CustomizationPanel({ customization: c, chartType, onChange }: CustomizationPanelProps) {
  function update(partial: Partial<ChartCustomization>) {
    onChange({ ...c, ...partial })
  }

  const isScatter = chartType === 'scatter'
  const isCartesian = !['pie', 'heatmap-correlation'].includes(chartType)
  const supportsLog = isCartesian && !['pie', 'bar-horizontal'].includes(chartType)

  return (
    <div className="space-y-4">

      {/* ── Titles & Labels ─────────────────────── */}
      <Card padding="md">
        <SectionHeader>Titles &amp; Labels</SectionHeader>
        <div className="space-y-3">
          <div>
            <label className={labelClass()} style={{ color: 'var(--ds-text-primary)' }}>Chart Title</label>
            <input
              type="text"
              value={c.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="e.g. Sales by Region"
              className={inputClass()}
              style={inputStyle()}
              aria-label="Chart title"
            />
          </div>
          <div>
            <label className={labelClass()} style={{ color: 'var(--ds-text-primary)' }}>Subtitle</label>
            <input
              type="text"
              value={c.subtitle}
              onChange={(e) => update({ subtitle: e.target.value })}
              placeholder="e.g. Q1 2024"
              className={inputClass()}
              style={inputStyle()}
              aria-label="Chart subtitle"
            />
          </div>
          {isCartesian && (
            <>
              <div>
                <label className={labelClass()} style={{ color: 'var(--ds-text-primary)' }}>X Axis Label</label>
                <input
                  type="text"
                  value={c.xAxisLabel}
                  onChange={(e) => update({ xAxisLabel: e.target.value })}
                  placeholder="e.g. Month"
                  className={inputClass()}
                  style={inputStyle()}
                  aria-label="X axis label"
                />
              </div>
              <div>
                <label className={labelClass()} style={{ color: 'var(--ds-text-primary)' }}>Y Axis Label</label>
                <input
                  type="text"
                  value={c.yAxisLabel}
                  onChange={(e) => update({ yAxisLabel: e.target.value })}
                  placeholder="e.g. Revenue"
                  className={inputClass()}
                  style={inputStyle()}
                  aria-label="Y axis label"
                />
              </div>
            </>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={c.showDataLabels}
              onChange={(e) => update({ showDataLabels: e.target.checked })}
              className="w-4 h-4 rounded accent-[#3B5BDB]"
              aria-label="Show data labels"
            />
            <span className="text-[13px]" style={{ color: 'var(--ds-text-primary)' }}>Show data labels</span>
          </label>
        </div>
      </Card>

      {/* ── Colors ─────────────────────────────── */}
      <Card padding="md">
        <SectionHeader>Colors</SectionHeader>
        <div className="space-y-3">
          <div>
            <label className={labelClass()} style={{ color: 'var(--ds-text-primary)' }}>Color Palette</label>
            <div className="grid grid-cols-1 gap-2">
              {(Object.keys(COLOR_PALETTES) as ColorPaletteName[]).map((name) => {
                const isSelected = c.colorPalette === name
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => update({ colorPalette: name })}
                    className={[
                      'flex items-center gap-3 w-full px-3 py-2 rounded-lg border text-left transition-all duration-150 cursor-pointer',
                      isSelected ? 'border-[#3B5BDB] bg-[#EEF2FF]' : 'hover:bg-slate-50',
                    ].join(' ')}
                    style={{ borderColor: isSelected ? '#3B5BDB' : 'var(--ds-border)' }}
                    aria-pressed={isSelected}
                    aria-label={`Select ${name} palette`}
                  >
                    <div className="flex gap-1 shrink-0">
                      {COLOR_PALETTES[name].slice(0, 5).map((color, i) => (
                        <span
                          key={i}
                          className="w-3.5 h-3.5 rounded-sm"
                          style={{ background: color }}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <span
                      className="text-[12px] font-medium capitalize"
                      style={{ color: isSelected ? 'var(--ds-primary)' : 'var(--ds-text-secondary)' }}
                    >
                      {name}
                    </span>
                    {isSelected && (
                      <svg className="w-3.5 h-3.5 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ color: 'var(--ds-primary)' }} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* ── Axes ───────────────────────────────── */}
      {isCartesian && (
        <Card padding="md">
          <SectionHeader>Axes</SectionHeader>
          <div className="space-y-3">
            <div>
              <label className={labelClass()} style={{ color: 'var(--ds-text-primary)' }}>Number Format</label>
              <select
                value={c.numberFormat}
                onChange={(e) => update({ numberFormat: e.target.value as NumberFormat })}
                className={inputClass()}
                style={inputStyle()}
                aria-label="Number format"
              >
                <option value="plain">Plain (1234)</option>
                <option value="currency">Currency ($1,234)</option>
                <option value="percentage">Percentage (1234%)</option>
                <option value="compact">Compact (1.2K)</option>
              </select>
            </div>

            {supportsLog && (
              <div>
                <label className={labelClass()} style={{ color: 'var(--ds-text-primary)' }}>Y Axis Scale</label>
                <div className="flex gap-2">
                  {(['linear', 'log'] as AxisScaleType[]).map((scale) => (
                    <button
                      key={scale}
                      type="button"
                      onClick={() => update({ yAxisScale: scale })}
                      className={[
                        'flex-1 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-all duration-150 cursor-pointer',
                        c.yAxisScale === scale ? 'border-[#3B5BDB] bg-[#EEF2FF] text-[#3B5BDB]' : 'hover:bg-slate-50',
                      ].join(' ')}
                      style={{ borderColor: c.yAxisScale === scale ? '#3B5BDB' : 'var(--ds-border)', color: c.yAxisScale === scale ? 'var(--ds-primary)' : 'var(--ds-text-secondary)' }}
                      aria-pressed={c.yAxisScale === scale}
                    >
                      {scale.charAt(0).toUpperCase() + scale.slice(1)}
                    </button>
                  ))}
                </div>
                {c.yAxisScale === 'log' && (
                  <p className="text-[11px] mt-1" style={{ color: 'var(--ds-warning)' }}>
                    ⚠ Log scale requires all values to be greater than zero.
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass()} style={{ color: 'var(--ds-text-primary)' }}>Y Min</label>
                <input
                  type="number"
                  value={c.yAxisMin ?? ''}
                  onChange={(e) => update({ yAxisMin: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="auto"
                  className={inputClass()}
                  style={inputStyle()}
                  aria-label="Y axis minimum"
                />
              </div>
              <div>
                <label className={labelClass()} style={{ color: 'var(--ds-text-primary)' }}>Y Max</label>
                <input
                  type="number"
                  value={c.yAxisMax ?? ''}
                  onChange={(e) => update({ yAxisMax: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="auto"
                  className={inputClass()}
                  style={inputStyle()}
                  aria-label="Y axis maximum"
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── Display ────────────────────────────── */}
      <Card padding="md">
        <SectionHeader>Display</SectionHeader>
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={c.showLegend}
              onChange={(e) => update({ showLegend: e.target.checked })}
              className="w-4 h-4 rounded accent-[#3B5BDB]"
              aria-label="Show legend"
            />
            <span className="text-[13px]" style={{ color: 'var(--ds-text-primary)' }}>Show legend</span>
          </label>

          {c.showLegend && (
            <div>
              <label className={labelClass()} style={{ color: 'var(--ds-text-primary)' }}>Legend Position</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['top', 'bottom', 'left', 'right'] as LegendPosition[]).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => update({ legendPosition: pos })}
                    className={[
                      'px-2 py-1.5 rounded-lg border text-[11px] font-medium transition-all duration-150 cursor-pointer capitalize',
                      c.legendPosition === pos ? 'border-[#3B5BDB] bg-[#EEF2FF] text-[#3B5BDB]' : 'hover:bg-slate-50',
                    ].join(' ')}
                    style={{ borderColor: c.legendPosition === pos ? '#3B5BDB' : 'var(--ds-border)', color: c.legendPosition === pos ? 'var(--ds-primary)' : 'var(--ds-text-secondary)' }}
                    aria-pressed={c.legendPosition === pos}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isScatter && (
            <>
              <div>
                <label className={labelClass()} style={{ color: 'var(--ds-text-primary)' }}>Marker Size: {c.markerSize}</label>
                <input
                  type="range"
                  min={2}
                  max={20}
                  value={c.markerSize}
                  onChange={(e) => update({ markerSize: Number(e.target.value) })}
                  className="w-full accent-[#3B5BDB]"
                  aria-label={`Marker size: ${c.markerSize}`}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={c.showRegressionLine}
                  onChange={(e) => update({ showRegressionLine: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#3B5BDB]"
                  aria-label="Show regression line"
                />
                <span className="text-[13px]" style={{ color: 'var(--ds-text-primary)' }}>
                  Show linear regression trendline
                </span>
              </label>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
