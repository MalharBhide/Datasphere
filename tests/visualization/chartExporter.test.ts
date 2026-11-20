/**
 * chartExporter.test.ts
 *
 * Smoke tests for src/features/visualization/lib/chartExporter.ts
 * Verifies that the exporter calls the right ECharts APIs and triggers
 * a browser download without actually rendering a chart.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { exportChartAsPNG, exportChartAsSVG } from '../../src/features/visualization/lib/chartExporter'

// ── Mock ECharts instance ─────────────────────────────────────────────────

function makeMockEchartsInstance(dataUrl = 'data:image/png;base64,abc123') {
  return {
    getDataURL: vi.fn().mockReturnValue(dataUrl),
  }
}

// ── Mock browser DOM APIs ─────────────────────────────────────────────────

describe('exportChartAsPNG', () => {
  let mockLink: { href: string; download: string; click: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    mockLink = { href: '', download: '', click: vi.fn() }
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') return mockLink as unknown as HTMLElement
      return document.createElement.call(document, tag) as HTMLElement
    })
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as Node)
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as unknown as Node)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls getDataURL with png type and white background', () => {
    const instance = makeMockEchartsInstance()
    exportChartAsPNG(instance as never, 'My Chart')
    expect(instance.getDataURL).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'png', backgroundColor: '#ffffff' }),
    )
  })

  it('sets correct href on the download link', () => {
    const dataUrl = 'data:image/png;base64,testdata'
    const instance = makeMockEchartsInstance(dataUrl)
    exportChartAsPNG(instance as never, 'Test Chart')
    expect(mockLink.href).toBe(dataUrl)
  })

  it('download filename includes chart title and .png extension', () => {
    const instance = makeMockEchartsInstance()
    exportChartAsPNG(instance as never, 'My Sales Chart')
    expect(mockLink.download).toMatch(/^My_Sales_Chart/)
    expect(mockLink.download).toMatch(/\.png$/)
  })

  it('calls click on the link element', () => {
    const instance = makeMockEchartsInstance()
    exportChartAsPNG(instance as never, 'Chart')
    expect(mockLink.click).toHaveBeenCalled()
  })

  it('appends and removes the link from document body', () => {
    const instance = makeMockEchartsInstance()
    const appendSpy = vi.spyOn(document.body, 'appendChild')
    const removeSpy = vi.spyOn(document.body, 'removeChild')
    exportChartAsPNG(instance as never, 'Chart')
    expect(appendSpy).toHaveBeenCalled()
    expect(removeSpy).toHaveBeenCalled()
  })

  it('sanitizes special characters in filename', () => {
    const instance = makeMockEchartsInstance()
    exportChartAsPNG(instance as never, 'Revenue: Q1 & Q2')
    expect(mockLink.download).not.toMatch(/[:& ]/)
    expect(mockLink.download).toMatch(/\.png$/)
  })

  it('uses "chart" as filename when title is empty', () => {
    const instance = makeMockEchartsInstance()
    exportChartAsPNG(instance as never, '')
    expect(mockLink.download).toMatch(/^chart_/)
  })
})

describe('exportChartAsSVG - type check', () => {
  it('is a function', () => {
    expect(typeof exportChartAsSVG).toBe('function')
  })
})
