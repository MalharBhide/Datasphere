/**
 * chartExporter.ts
 *
 * Exports an ECharts instance to PNG or SVG via browser download.
 *
 * PNG: uses ECharts canvas renderer getDataURL.
 * SVG: creates a temporary off-screen ECharts instance with SVG renderer,
 *      renders the same option, extracts SVG markup, and downloads it.
 */
import * as echarts from 'echarts'

type EChartsInstance = ReturnType<typeof echarts.getInstanceById> extends null | undefined
  ? never
  : NonNullable<ReturnType<typeof echarts.getInstanceById>>

function triggerDownload(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function sanitizeFilename(title: string, suffix: string): string {
  const base = title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60) || 'chart'
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  return `${base}_${ts}.${suffix}`
}

export function exportChartAsPNG(
  echartsInstance: EChartsInstance,
  chartTitle: string,
): void {
  const dataUrl = echartsInstance.getDataURL({
    type: 'png',
    backgroundColor: '#ffffff',
    pixelRatio: 2,
  })
  triggerDownload(dataUrl, sanitizeFilename(chartTitle, 'png'))
}

export function exportChartAsSVG(
  option: Record<string, unknown>,
  chartTitle: string,
  width?: number,
  height?: number,
): void {
  // Create a temporary off-screen container for the SVG renderer
  const container = document.createElement('div')
  container.style.cssText = `
    position: absolute;
    left: -9999px;
    top: -9999px;
    width: ${width ?? 1200}px;
    height: ${height ?? 600}px;
    visibility: hidden;
  `
  document.body.appendChild(container)

  let svgInstance: ReturnType<typeof echarts.init> | null = null
  try {
    svgInstance = echarts.init(container, undefined, { renderer: 'svg', width: width ?? 1200, height: height ?? 600 })
    svgInstance.setOption(option)

    // Extract the SVG markup
    const svgEl = container.querySelector('svg')
    if (!svgEl) throw new Error('SVG element not found')

    // Add proper XML declaration and namespace
    const svgString = `<?xml version="1.0" encoding="UTF-8"?>\n${svgEl.outerHTML}`
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    triggerDownload(url, sanitizeFilename(chartTitle, 'svg'))
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } finally {
    if (svgInstance) {
      svgInstance.dispose()
    }
    document.body.removeChild(container)
  }
}
