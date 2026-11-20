import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { OverviewPage } from './pages/OverviewPage'
import { DataCleaningPage } from './pages/DataCleaningPage'
import { DataVisualizationPage } from './pages/DataVisualizationPage'
import { CleaningSessionProvider } from './contexts/CleaningSessionContext'
import { VisualizationSessionProvider } from './contexts/VisualizationContext'

export default function App() {
  return (
    <CleaningSessionProvider>
      <VisualizationSessionProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/clean" element={<DataCleaningPage />} />
              <Route path="/visualize" element={<DataVisualizationPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </VisualizationSessionProvider>
    </CleaningSessionProvider>
  )
}
