/**
 * ExportPanel.tsx
 *
 * Step 5 (Preview & Export) — PNG and SVG download buttons.
 * Uses the ECharts instance from ChartPreview via ref.
 */
import { Button } from '../../../components/Button'
import { exportChartAsPNG, exportChartAsSVG } from '../lib/chartExporter'
import type { ChartPreviewHandle } from './ChartPreview'
import type { EChartsOption } from '../lib/echartsBuilder'

interface ExportPanelProps {
  chartRef: React.RefObject<ChartPreviewHandle | null>
  option: EChartsOption
  chartTitle: string
  disabled?: boolean
}

export function ExportPanel({ chartRef, option, chartTitle, disabled }: ExportPanelProps) {
  function handlePNG() {
    const instance = chartRef.current?.getEchartsInstance()
    if (!instance) return
    exportChartAsPNG(instance as Parameters<typeof exportChartAsPNG>[0], chartTitle)
  }

  function handleSVG() {
    exportChartAsSVG(option, chartTitle)
  }

  return (
    <div
      className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border"
      style={{ background: 'var(--ds-surface)', borderColor: 'var(--ds-border)' }}
    >
      <div>
        <p className="text-[13px] font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
          Export Chart
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--ds-text-muted)' }}>
          Download as PNG (high-resolution) or SVG (scalable vector).
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="secondary"
          size="sm"
          onClick={handlePNG}
          disabled={disabled}
          aria-label="Download chart as PNG"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          PNG
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSVG}
          disabled={disabled}
          aria-label="Download chart as SVG"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          SVG
        </Button>
      </div>
    </div>
  )
}
