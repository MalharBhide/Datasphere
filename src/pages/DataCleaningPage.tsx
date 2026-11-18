import { useCallback } from 'react'
import { UploadZone } from '../features/cleaning/components/UploadZone'
import { DataPreview } from '../features/cleaning/components/DataPreview'
import { IssuePanel } from '../features/cleaning/components/IssuePanel'
import { CleaningResults } from '../features/cleaning/components/CleaningResults'
import { parseFile, parseXLSX } from '../features/cleaning/lib/parser'
import { analyzeDataset } from '../features/cleaning/lib/detector'
import { applyCleaningOperations } from '../features/cleaning/lib/cleaner'
import { exportAsCSV, exportAsXLSX } from '../features/cleaning/lib/exporter'
import { sampleDataset } from '../data/sampleDataset'
import { useCleaningSession } from '../contexts/CleaningSessionContext'
import type { SelectedOperation } from '../features/cleaning/types'
import { Button } from '../components/Button'

const stepLabels: Record<Exclude<'upload' | 'preview' | 'clean' | 'results', 'upload'>, string> = {
  preview: 'Preview',
  clean: 'Detect & Clean',
  results: 'Results',
}

const stepOrder: Exclude<'upload' | 'preview' | 'clean' | 'results', 'upload'>[] = [
  'preview',
  'clean',
  'results',
]

function StepIndicator({ currentStep }: { currentStep: 'upload' | 'preview' | 'clean' | 'results' }) {
  if (currentStep === 'upload') return null
  return (
    <div className="flex items-center gap-1 mb-6">
      {stepOrder.map((s, i) => {
        const isCurrent = currentStep === s
        const isPast =
          (s === 'preview') ||
          (s === 'clean' && (currentStep === 'clean' || currentStep === 'results')) ||
          (s === 'results' && currentStep === 'results')
        return (
          <div key={s} className="flex items-center gap-1">
            {i > 0 && (
              <svg
                className="w-3 h-3 mx-0.5"
                style={{ color: 'var(--ds-text-muted)' }}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            )}
            <span
              className={[
                'text-[13px] font-medium',
                isCurrent ? 'font-semibold' : '',
              ].join(' ')}
              style={{
                color: isCurrent
                  ? 'var(--ds-primary)'
                  : isPast
                  ? 'var(--ds-text-secondary)'
                  : 'var(--ds-text-muted)',
              }}
            >
              {stepLabels[s]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function DataCleaningPage() {
  const { session, setSession, resetSession, fileRef } = useCleaningSession()
  const { step, dataset, issues, selectedOps, cleaningResult, isLoading, error } = session

  // ── Upload ──────────────────────────────────────────────────────────────────

  const handleFileSelected = useCallback(async (file: File) => {
    setSession({ isLoading: true, error: null })
    fileRef.current = file
    try {
      const parsed = await parseFile(file)
      setSession({ dataset: parsed, step: 'preview', isLoading: false })
    } catch (err) {
      setSession({
        error: err instanceof Error ? err.message : 'Failed to parse file.',
        isLoading: false,
      })
    }
  }, [setSession, fileRef])

  const handleSampleRequested = useCallback(() => {
    fileRef.current = null
    setSession({ dataset: sampleDataset, error: null, step: 'preview' })
  }, [setSession, fileRef])

  const handleSheetChange = useCallback(async (sheetName: string) => {
    if (!fileRef.current) return
    setSession({ isLoading: true, error: null })
    try {
      const parsed = await parseXLSX(fileRef.current, sheetName)
      setSession({ dataset: parsed, isLoading: false })
    } catch (err) {
      setSession({
        error: err instanceof Error ? err.message : 'Failed to load sheet.',
        isLoading: false,
      })
    }
  }, [setSession, fileRef])

  // ── Detect ──────────────────────────────────────────────────────────────────

  function handleAnalyze() {
    if (!dataset) return
    const detected = analyzeDataset(dataset)
    const ops: SelectedOperation[] = []
    for (const issue of detected) {
      for (const action of issue.availableActions) {
        ops.push({ action, enabled: false })
      }
    }
    setSession({ issues: detected, selectedOps: ops, step: 'clean' })
  }

  // ── Clean ───────────────────────────────────────────────────────────────────

  function handleClean() {
    if (!dataset) return
    const result = applyCleaningOperations(dataset, selectedOps)
    setSession({ cleaningResult: result, step: 'results' })
  }

  // ── Edit settings (back from results to clean step) ─────────────────────────

  function handleEditSettings() {
    // Return to the cleaning step — dataset and selectedOps are already preserved.
    // cleaningResult is cleared so the UI shows the issue panel, not stale results.
    setSession({ step: 'clean', cleaningResult: null })
  }

  // ── Export ──────────────────────────────────────────────────────────────────

  function handleExportCSV() {
    if (!cleaningResult || !dataset) return
    exportAsCSV(cleaningResult, dataset.columns, dataset.fileName)
  }

  function handleExportXLSX() {
    if (!cleaningResult || !dataset) return
    exportAsXLSX(cleaningResult, dataset.columns, dataset.fileName)
  }

  // ── Reset ───────────────────────────────────────────────────────────────────

  function handleReset() {
    resetSession()
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8" style={{ minHeight: '100%' }}>
      {/* Page header */}
      <div className="mb-7">
        <h1
          className="text-[22px] font-bold tracking-tight"
          style={{ color: 'var(--ds-text-primary)' }}
        >
          Data Cleaning
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--ds-text-secondary)' }}>
          Upload a dataset, detect quality issues, apply cleaning operations, and
          download the corrected file.
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator currentStep={step} />

      {/* ── Upload step ─────────────────────────── */}
      {step === 'upload' && (
        <div className="max-w-lg mx-auto">
          <UploadZone
            onFileSelected={handleFileSelected}
            onSampleRequested={handleSampleRequested}
            isLoading={isLoading}
            error={error}
          />
        </div>
      )}

      {/* ── Preview step ────────────────────────── */}
      {step === 'preview' && dataset && (
        <div className="space-y-5">
          <DataPreview
            dataset={dataset}
            onSheetChange={dataset.sheetNames ? handleSheetChange : undefined}
          />
          <div
            className="flex items-center gap-4 pt-3"
            style={{ borderTop: '1px solid var(--ds-border)' }}
          >
            <Button size="lg" onClick={handleAnalyze}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
              </svg>
              Detect Issues
            </Button>
            <button
              onClick={handleReset}
              className="text-sm cursor-pointer transition-colors duration-150"
              style={{ color: 'var(--ds-text-muted)' }}
            >
              ← Upload a different file
            </button>
          </div>
        </div>
      )}

      {/* ── Clean step ──────────────────────────── */}
      {step === 'clean' && dataset && (
        <IssuePanel
          issues={issues}
          selectedOps={selectedOps}
          onOperationsChange={(ops) => setSession({ selectedOps: ops })}
          onClean={handleClean}
          onReset={handleReset}
        />
      )}

      {/* ── Results step ────────────────────────── */}
      {step === 'results' && cleaningResult && dataset && (
        <CleaningResults
          result={cleaningResult}
          originalDataset={dataset}
          onReset={handleReset}
          onEditSettings={handleEditSettings}
          onExportCSV={handleExportCSV}
          onExportXLSX={handleExportXLSX}
        />
      )}
    </div>
  )
}
