import { useRef, useState, type DragEvent } from 'react'
import { Button } from '../../../components/Button'

interface UploadZoneProps {
  onFileSelected: (file: File) => void
  onSampleRequested: () => void
  isLoading: boolean
  error: string | null
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function UploadZone({
  onFileSelected,
  onSampleRequested,
  isLoading,
  error,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  function handleFile(file: File) {
    setPendingFile(file)
    onFileSelected(file)
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
    <div className="space-y-3">
      {/* ── Drop zone ──────────────────────────────── */}
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
        aria-label="Upload a CSV or XLSX file"
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
            <svg
              className="w-6 h-6 text-[#3B5BDB] animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg
              className={['w-6 h-6 transition-colors', isDragging ? 'text-[#3B5BDB]' : 'text-slate-400'].join(' ')}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
              aria-hidden="true"
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

      {/* ── Error message ──────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm"
          style={{
            background: 'var(--ds-danger-light)',
            borderColor: '#FECACA',
            color: 'var(--ds-danger)',
          }}
        >
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* ── Sample divider ─────────────────────────── */}
      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 h-px" style={{ background: 'var(--ds-border)' }} />
        <span className="text-xs shrink-0" style={{ color: 'var(--ds-text-muted)' }}>or try a demo</span>
        <div className="flex-1 h-px" style={{ background: 'var(--ds-border)' }} />
      </div>

      <div className="flex justify-center">
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onSampleRequested()
          }}
          disabled={isLoading}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
          </svg>
          Try Sample Dataset
        </Button>
      </div>
    </div>
  )
}
