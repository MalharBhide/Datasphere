import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type { ParsedDataset, Row, CellValue } from '../types'

// ── CSV ──────────────────────────────────────────────────────────────────────

export function parseCSV(file: File): Promise<ParsedDataset> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // keep everything as strings for issue detection
      complete(results) {
        const columns = results.meta.fields ?? []
        if (columns.length === 0) {
          return reject(new Error('No columns found in file.'))
        }
        const rows: Row[] = results.data.map((r) => {
          const row: Row = {}
          for (const col of columns) {
            const v = r[col]
            row[col] = v === undefined || v === '' ? null : v
          }
          return row
        })
        if (rows.length === 0) {
          return reject(new Error('No data rows found in file.'))
        }
        resolve({ fileName: file.name, columns, rows })
      },
      error(err) {
        reject(new Error(`CSV parse error: ${err.message}`))
      },
    })
  })
}

// ── XLSX ─────────────────────────────────────────────────────────────────────

export async function parseXLSX(
  file: File,
  sheetName?: string,
): Promise<ParsedDataset> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' })
  const sheetNames = workbook.SheetNames

  if (sheetNames.length === 0) {
    throw new Error('No sheets found in workbook.')
  }

  const targetSheet = sheetName ?? sheetNames[0]
  const sheet = workbook.Sheets[targetSheet]

  if (!sheet) {
    throw new Error(`Sheet "${targetSheet}" not found.`)
  }

  // header:1 gives us an array-of-arrays; first row = column names
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null })

  if (raw.length === 0) {
    throw new Error('No data found in sheet.')
  }

  const headers = (raw[0] as unknown[]).map((h) => String(h ?? '').trim())
  if (headers.length === 0 || headers.every((h) => h === '')) {
    throw new Error('No columns found in sheet.')
  }

  const dataRows = raw.slice(1)
  if (dataRows.length === 0) {
    throw new Error('No data rows found in file.')
  }

  const rows: Row[] = dataRows.map((rawRow) => {
    const arr = rawRow as unknown[]
    const row: Row = {}
    for (let i = 0; i < headers.length; i++) {
      const col = headers[i]
      const val = arr[i] ?? null
      if (val === null || val === undefined || val === '') {
        row[col] = null
      } else if (typeof val === 'number') {
        row[col] = val
      } else {
        row[col] = String(val) as CellValue
      }
    }
    return row
  })

  return {
    fileName: file.name,
    columns: headers,
    rows,
    sheetNames,
    activeSheet: targetSheet,
  }
}

// ── Dispatcher ───────────────────────────────────────────────────────────────

export async function parseFile(
  file: File,
  sheetName?: string,
): Promise<ParsedDataset> {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'csv') return parseCSV(file)
  if (ext === 'xlsx') return parseXLSX(file, sheetName)
  throw new Error(
    `Unsupported file type ".${ext ?? 'unknown'}". Please upload a CSV or XLSX file.`,
  )
}
