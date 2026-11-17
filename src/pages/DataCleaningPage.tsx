import { useState, useCallback, useRef } from 'react'
import { UploadZone } from '../features/cleaning/components/UploadZone'
import { DataPreview } from '../features/cleaning/components/DataPreview'
import { IssuePanel } from '../features/cleaning/components/IssuePanel'
import { CleaningResults } from '../features/cleaning/components/CleaningResults'
import { parseFile, parseXLSX } from '../features/cleaning/lib/parser'
import { analyzeDataset } from '../features/cleaning/lib/detector'
import { applyCleaningOperations } from '../features/cleaning/lib/cleaner'
import { exportAsCSV, exportAsXLSX } from '../features/cleaning/lib/exporter'
import { sampleDataset } from '../data/sampleDataset'
import type {
  ParsedDataset,
  DetectedIssue,
  SelectedOperation,
  CleaningResult,
} from '../features/cleaning/types'
import { Button } from '../components/Button'

type Step = 'upload' | 'preview' | 'clean' | 'results'

export function DataCleaningPage() {
  const [step, setStep] = useState<Step>('upload')
  const [dataset, setDataset] = useState<ParsedDataset | null>(null)
  const [issues, setIssues] = useState<DetectedIssue[]>([])
  const [selectedOps, setSelectedOps] = useState<SelectedOperation[]>([])
  const [cleaningResult, setCleaningResult] = useState<CleaningResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Store original File for XLSX sheet switching
  const fileRef = useRef<File | null>(null)

  // ── Upload ──────────────────────────────────────────────────────────────────

  const handleFileSelected = useCallback(async (file: File) => {
    setIsLoading(true)
    setError(null)
    fileRef.current = file
    try {
      const parsed = await parseFile(file)
      setDataset(parsed)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSampleRequested = useCallback(() => {
    fileRef.current = null
    setDataset(sampleDataset)
    setError(null)
    setStep('preview')
  }, [])

  const handleSheetChange = useCallback(async (sheetName: string) => {
    if (!fileRef.current) return
    setIsLoading(true)
    setError(null)
    try {
      const parsed = await parseXLSX(fileRef.current, sheetName)
      setDataset(parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sheet.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── Detect issues ──────────────────────────────────────────────────────────

  function handleAnalyze() {
    if (!dataset) return
    const detected = analyzeDataset(dataset)
    setIssues(detected)
    // Initialize selected ops from available actions
    const ops: SelectedOperation[] = []
    for (const issue of detected) {
      for (const action of issue.availableActions) {
        ops.push({ action, enabled: false })
      }
    }
    setSelectedOps(ops)
    setStep('clean')
  }

  // ── Clean ──────────────────────────────────────────────────────────────────

  function handleClean() {
    if (!dataset) return
    const result = applyCleaningOperations(dataset, selectedOps)
    setCleaningResult(result)
    setStep('results')
  }

  // ── Export ─────────────────────────────────────────────────────────────────

  function handleExportCSV() {
    if (!cleaningResult || !dataset) return
    exportAsCSV(cleaningResult, dataset.columns, dataset.fileName)
  }

  function handleExportXLSX() {
    if (!cleaningResult || !dataset) return
    exportAsXLSX(cleaningResult, dataset.columns, dataset.fileName)
  }

  // ── Reset ──────────────────────────────────────────────────────────────────

  function handleReset() {
    setStep('upload')
    setDataset(null)
    setIssues([])
    setSelectedOps([])
    setCleaningResult(null)
    setError(null)
    fileRef.current = null
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Data Cleaning</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload a dataset, detect quality issues, apply cleaning operations, and
          download the corrected file.
        </p>
      </div>

      {/* Step indicator */}
      {step !== 'upload' && (
        <div className="mb-6 flex items-center gap-2 text-sm">
          {(['preview', 'clean', 'results'] as const).map((s, i) => {
            const labels: Record<string, string> = {
              preview: '1. Preview',
              clean: '2. Clean',
              results: '3. Results',
            }
            const isCurrent = step === s
            const isPast =
              (s === 'preview') ||
              (s === 'clean' && (step === 'clean' || step === 'results')) ||
              (s === 'results' && step === 'results')
            return (
              <span key={s} className="flex items-center gap-2">
                {i > 0 && <span className="text-gray-300">›</span>}
                <span
                  className={`${
                    isCurrent
                      ? 'font-semibold text-blue-700'
                      : isPast
                      ? 'text-gray-500'
                      : 'text-gray-300'
                  }`}
                >
                  {labels[s]}
                </span>
              </span>
            )
          })}
        </div>
      )}

      {/* Upload step */}
      {step === 'upload' && (
        <div className="max-w-xl mx-auto">
          <UploadZone
            onFileSelected={handleFileSelected}
            onSampleRequested={handleSampleRequested}
            isLoading={isLoading}
            error={error}
          />
        </div>
      )}

      {/* Preview step */}
      {step === 'preview' && dataset && (
        <div className="space-y-6">
          <DataPreview
            dataset={dataset}
            onSheetChange={dataset.sheetNames ? handleSheetChange : undefined}
          />
          <div className="flex items-center gap-3">
            <Button size="lg" onClick={handleAnalyze}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Detect Issues
            </Button>
            <button
              onClick={handleReset}
              className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
            >
              ← Upload a different file
            </button>
          </div>
        </div>
      )}

      {/* Clean step */}
      {step === 'clean' && dataset && (
        <IssuePanel
          issues={issues}
          selectedOps={selectedOps}
          onOperationsChange={setSelectedOps}
          onClean={handleClean}
          onReset={handleReset}
        />
      )}

      {/* Results step */}
      {step === 'results' && cleaningResult && dataset && (
        <CleaningResults
          result={cleaningResult}
          originalDataset={dataset}
          onReset={handleReset}
          onExportCSV={handleExportCSV}
          onExportXLSX={handleExportXLSX}
        />
      )}
    </div>
  )
}
