/**
 * VisualizationContext
 *
 * Persists the entire visualization wizard state across route navigations.
 * Mirrors the CleaningSessionContext pattern exactly.
 */
import { createContext, useContext, useState, type ReactNode } from 'react'
import type { VisualizationSession } from '../features/visualization/types'
import { defaultVisualizationSession } from '../features/visualization/types'

interface VisualizationSessionContextValue {
  session: VisualizationSession
  setSession: (patch: Partial<VisualizationSession>) => void
  resetSession: () => void
}

const VisualizationContext = createContext<VisualizationSessionContextValue | null>(null)

export function VisualizationSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<VisualizationSession>(defaultVisualizationSession)

  function setSession(patch: Partial<VisualizationSession>) {
    setSessionState((prev) => ({ ...prev, ...patch }))
  }

  function resetSession() {
    setSessionState(defaultVisualizationSession)
  }

  return (
    <VisualizationContext.Provider value={{ session, setSession, resetSession }}>
      {children}
    </VisualizationContext.Provider>
  )
}

export function useVisualizationSession(): VisualizationSessionContextValue {
  const ctx = useContext(VisualizationContext)
  if (!ctx) {
    throw new Error('useVisualizationSession must be used inside <VisualizationSessionProvider>')
  }
  return ctx
}
