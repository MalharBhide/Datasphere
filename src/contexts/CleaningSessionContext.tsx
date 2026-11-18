/**
 * CleaningSessionContext
 *
 * Persists the entire data-cleaning workflow state across route navigations.
 * Stored at the React-tree level (not sessionStorage) so it survives SPA
 * route changes but is naturally cleared on hard refresh — which is correct
 * for a client-side tool that never uploads user data.
 */
import { createContext, useContext, useRef, useState, type ReactNode } from 'react'
import type {
  ParsedDataset,
  DetectedIssue,
  SelectedOperation,
  CleaningResult,
} from '../features/cleaning/types'

export type CleaningStep = 'upload' | 'preview' | 'clean' | 'results'

export interface CleaningSession {
  step: CleaningStep
  dataset: ParsedDataset | null
  issues: DetectedIssue[]
  selectedOps: SelectedOperation[]
  cleaningResult: CleaningResult | null
  isLoading: boolean
  error: string | null
}

interface CleaningSessionContextValue {
  session: CleaningSession
  setSession: (patch: Partial<CleaningSession>) => void
  resetSession: () => void
  fileRef: React.MutableRefObject<File | null>
}

const defaultSession: CleaningSession = {
  step: 'upload',
  dataset: null,
  issues: [],
  selectedOps: [],
  cleaningResult: null,
  isLoading: false,
  error: null,
}

const CleaningSessionContext = createContext<CleaningSessionContextValue | null>(null)

export function CleaningSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<CleaningSession>(defaultSession)
  const fileRef = useRef<File | null>(null)

  function setSession(patch: Partial<CleaningSession>) {
    setSessionState((prev) => ({ ...prev, ...patch }))
  }

  function resetSession() {
    fileRef.current = null
    setSessionState(defaultSession)
  }

  return (
    <CleaningSessionContext.Provider value={{ session, setSession, resetSession, fileRef }}>
      {children}
    </CleaningSessionContext.Provider>
  )
}

export function useCleaningSession(): CleaningSessionContextValue {
  const ctx = useContext(CleaningSessionContext)
  if (!ctx) {
    throw new Error('useCleaningSession must be used inside <CleaningSessionProvider>')
  }
  return ctx
}
