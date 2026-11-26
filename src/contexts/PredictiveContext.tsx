/**
 * PredictiveContext.tsx
 *
 * Persists Predictive Analytics page state across SPA route navigations.
 * Follows the same pattern as CleaningSessionContext and VisualizationContext.
 */
import { createContext, useContext, useState, type ReactNode } from 'react'
import type { RegressionResult, RegressionError } from '../features/predictive/lib/regression'
import type { ForecastResult, ForecastError } from '../features/predictive/lib/forecasting'

export type AnalysisMethod = 'linear-regression' | 'time-series'

export interface PredictiveSession {
  method: AnalysisMethod
  // Which dataset is selected: 'original', 'cleaned', or null (none)
  datasetSource: 'original' | 'cleaned' | null
  // Regression config
  xCol: string
  yCol: string
  predictX: string
  regressionResult: RegressionResult | RegressionError | null
  // Forecasting config
  dateCol: string
  valueCol: string
  periods: number
  forecastResult: ForecastResult | ForecastError | null
}

interface PredictiveContextValue {
  session: PredictiveSession
  setSession: (patch: Partial<PredictiveSession>) => void
  resetResults: () => void
}

const defaultSession: PredictiveSession = {
  method: 'linear-regression',
  datasetSource: null,
  xCol: '',
  yCol: '',
  predictX: '',
  regressionResult: null,
  dateCol: '',
  valueCol: '',
  periods: 5,
  forecastResult: null,
}

const PredictiveContext = createContext<PredictiveContextValue | null>(null)

export function PredictiveProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<PredictiveSession>(defaultSession)

  function setSession(patch: Partial<PredictiveSession>) {
    setSessionState((prev) => ({ ...prev, ...patch }))
  }

  function resetResults() {
    setSessionState((prev) => ({
      ...prev,
      regressionResult: null,
      forecastResult: null,
    }))
  }

  return (
    <PredictiveContext.Provider value={{ session, setSession, resetResults }}>
      {children}
    </PredictiveContext.Provider>
  )
}

export function usePredictive(): PredictiveContextValue {
  const ctx = useContext(PredictiveContext)
  if (!ctx) {
    throw new Error('usePredictive must be used inside <PredictiveProvider>')
  }
  return ctx
}
