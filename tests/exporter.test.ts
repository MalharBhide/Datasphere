import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportAsCSV } from '../src/features/cleaning/lib/exporter'
import type { CleaningResult } from '../src/features/cleaning/types'

// Mock browser APIs not available in jsdom
beforeEach(() => {
  // URL.createObjectURL
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  global.URL.revokeObjectURL = vi.fn()

  // Mock <a> click
  const originalCreate = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    const el = originalCreate(tag)
    if (tag === 'a') {
      vi.spyOn(el as HTMLAnchorElement, 'click').mockImplementation(() => undefined)
    }
    return el
  })
})

function makeResult(rows: Record<string, unknown>[]): CleaningResult {
  return {
    cleanedRows: rows as CleaningResult['cleanedRows'],
    originalRowCount: rows.length,
    finalRowCount: rows.length,
    changeSummary: [],
    changedCells: new Set(),
  }
}

describe('exportAsCSV', () => {
  it('calls URL.createObjectURL to trigger a download', () => {
    const result = makeResult([{ name: 'Alice', age: 29 }, { name: 'Bob', age: 34 }])
    exportAsCSV(result, ['name', 'age'], 'test.csv')
    expect(URL.createObjectURL).toHaveBeenCalledOnce()
  })

  it('creates a Blob with CSV content type', () => {
    const result = makeResult([{ id: 1, value: 'hello' }])
    exportAsCSV(result, ['id', 'value'], 'data.csv')
    const blobArg = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0] as Blob
    expect(blobArg.type).toContain('text/csv')
  })

  it('appends _cleaned to the filename', () => {
    const result = makeResult([{ x: 1 }])
    const a = { href: '', download: '', click: vi.fn() }
    vi.spyOn(document, 'createElement').mockReturnValueOnce(a as unknown as HTMLElement)
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => a as unknown as Node)
    exportAsCSV(result, ['x'], 'myfile.csv')
    expect(a.download).toBe('myfile_cleaned.csv')
  })
})
