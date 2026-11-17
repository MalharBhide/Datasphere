import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type { CleaningResult, Row } from '../types'

function buildRowObjects(result: CleaningResult, columns: string[]): Row[] {
  return result.cleanedRows.map((row) => {
    const obj: Row = {}
    for (const col of columns) {
      obj[col] = row[col] ?? null
    }
    return obj
  })
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}

export function exportAsCSV(
  result: CleaningResult,
  columns: string[],
  fileName: string,
): void {
  const rows = buildRowObjects(result, columns)
  const csv = Papa.unparse(rows, { columns })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const baseName = fileName.replace(/\.[^.]+$/, '')
  triggerDownload(blob, `${baseName}_cleaned.csv`)
}

export function exportAsXLSX(
  result: CleaningResult,
  columns: string[],
  fileName: string,
): void {
  const rows = buildRowObjects(result, columns)
  const ws = XLSX.utils.json_to_sheet(rows, { header: columns })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Cleaned Data')
  const baseName = fileName.replace(/\.[^.]+$/, '')
  XLSX.writeFile(wb, `${baseName}_cleaned.xlsx`)
}
