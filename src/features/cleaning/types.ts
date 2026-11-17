// Core data types

export type CellValue = string | number | null

export type Row = Record<string, CellValue>

export interface ParsedDataset {
  fileName: string
  columns: string[]
  rows: Row[]
  sheetNames?: string[]
  activeSheet?: string
}

// Issue detection types

export type IssueKind =
  | 'missing_values'
  | 'duplicate_rows'
  | 'whitespace'
  | 'numeric_as_text'
  | 'inconsistent_casing'
  | 'outliers'

export type CapStyle = 'title' | 'upper' | 'lower'

export interface CleaningAction {
  id: string
  label: string
  params?: {
    column?: string
    fillStrategy?: 'median' | 'mean' | 'custom'
    customValue?: string
    capStyle?: CapStyle
  }
}

export interface DetectedIssue {
  kind: IssueKind
  affectedCount: number
  affectedColumns: string[]
  explanation: string
  example: string
  availableActions: CleaningAction[]
}

// Cleaning operation selection

export interface SelectedOperation {
  action: CleaningAction
  enabled: boolean
}

// Cleaning result types

export interface ChangeSummaryItem {
  operation: string
  count: number
  description: string
}

export interface CleaningResult {
  cleanedRows: Row[]
  originalRowCount: number
  finalRowCount: number
  changeSummary: ChangeSummaryItem[]
  changedCells: Set<string>
}
