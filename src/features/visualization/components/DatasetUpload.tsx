/**
 * DatasetUpload.tsx
 *
 * Step 1 of the visualization wizard.
 * Allows uploading a new CSV/XLSX, or using a cleaned dataset from the
 * Data Cleaning session.
 */
import { useRef, useState, type DragEvent } from 'react'
import { Button } from '../../../components/Button'
import { Card } from '../../../components/Card'
import { parseFile } from '../../cleaning/lib/parser'
import { detectColumnTypes } from '../lib/fieldDetector'
import { useCleaningSession } from '../../../contexts/CleaningSessionContext'
import { useVisualizationSession } from '../../../contexts/VisualizationContext'
import type { ParsedDataset } from '../../cleaning/types'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DatasetUpload() {
  const { session: cleanSession } = useCleaningSession()
  const { setSession } = useVisualizationSession()

  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const cleanedDataset = cleanSession.cleaningResult && cleanSession.dataset
    ? {
        fileName: cleanSession.dataset.fileName,
        columns: cleanSession.dataset.columns,
        rows: cleanSession.cleaningResult.cleanedRows,
      }
    : null

  async function loadDataset(dataset: ParsedDataset) {
    setIsLoading(true)
    setError(null)
    try {
      const columnMetas = detectColumnTypes(dataset)
      setSession({
        dataset,
        columnMetas,
        step: 'chart-type',
        error: null,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to process dataset.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleFile(file: File) {
    setPendingFile(file)
    setError(null)
    setIsLoading(true)
    try {
      const dataset = await parseFile(file)
      await loadDataset(dataset)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse file.')
      setIsLoading(false)
    }
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(true)
  }

  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function onInputChange() {
    const file = inputRef.current?.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-5">
      {/* ── Upload zone ────────────────────────────── */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !isLoading && inputRef.current?.click()}
        className={[
          'relative flex flex-col items-center justify-center gap-4',
          'rounded-2xl border-2 border-dashed px-8 py-12 text-center',
          'transition-all duration-150 cursor-pointer select-none',
          isDragging
            ? 'border-[#3B5BDB] bg-[#EEF2FF]'
            : error
            ? 'border-[#D63939] bg-[#FFE0E0]/30'
            : 'border-[#CBD5E1] bg-white hover:border-[#3B5BDB] hover:bg-[#EEF2FF]/40',
        ].join(' ')}
        role="button"
        tabIndex={0}
        aria-label="Upload a CSV or XLSX file for visualization"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx"
          className="sr-only"
          onChange={onInputChange}
          aria-hidden="true"
        />

        {/* Upload icon */}
        <div
          className={[
            'w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-150',
            isDragging ? 'bg-[#3B5BDB]/10' : 'bg-slate-100',
          ].join(' ')}
        >
          {isLoading ? (
            <svg className="w-6 h-6 text-[#3B5BDB] animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg
              className={['w-6 h-6 transition-colors', isDragging ? 'text-[#3B5BDB]' : 'text-slate-400'].join(' ')}
              fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          )}
        </div>

        {/* Text */}
        {isLoading ? (
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
              Parsing file…
            </p>
            {pendingFile && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--ds-text-muted)', fontFamily: 'var(--ds-font-mono)' }}>
                {pendingFile.name}
              </p>
            )}
          </div>
        ) : (
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
              {isDragging ? 'Drop file here' : 'Drag & drop a file here'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--ds-text-muted)' }}>
              CSV or XLSX, any size ·{' '}
              <span style={{ color: 'var(--ds-primary)' }}>or click to browse</span>
            </p>
          </div>
        )}

        {/* File chip */}
        {pendingFile && !isLoading && !error && (
          <div
            className="flex items-center gap-2 text-xs rounded-lg px-3 py-1.5 border"
            style={{
              background: 'var(--ds-accent-light)',
              borderColor: '#6EE7B7',
              color: '#065F46',
              fontFamily: 'var(--ds-font-mono)',
            }}
          >
            <svg className="w-3.5 h-3.5 text-[#0CA678] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">{pendingFile.name}</span>
            <span style={{ color: '#059669' }}>({formatBytes(pendingFile.size)})</span>
          </div>
        )}
      </div>

      {/* ── Error ──────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm"
          style={{ background: 'var(--ds-danger-light)', borderColor: '#FECACA', color: 'var(--ds-danger)' }}
        >
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* ── Use cleaned dataset option ──────────────── */}
      {cleanedDataset && (
        <>
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px" style={{ background: 'var(--ds-border)' }} />
            <span className="text-xs shrink-0" style={{ color: 'var(--ds-text-muted)' }}>or use existing data</span>
            <div className="flex-1 h-px" style={{ background: 'var(--ds-border)' }} />
          </div>

          <Card padding="md">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'var(--ds-accent-light)', color: 'var(--ds-accent)' }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--ds-text-primary)' }}>
                    Cleaned: {cleanedDataset.fileName}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--ds-text-secondary)' }}>
                    {cleanedDataset.rows.length.toLocaleString()} rows · {cleanedDataset.columns.length} columns
                  </p>
                </div>
              </div>
              <Button
                variant="success"
                size="sm"
                onClick={() => loadDataset(cleanedDataset)}
                disabled={isLoading}
              >
                Use This Dataset
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
