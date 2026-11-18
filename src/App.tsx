import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { OverviewPage } from './pages/OverviewPage'
import { DataCleaningPage } from './pages/DataCleaningPage'
import { CleaningSessionProvider } from './contexts/CleaningSessionContext'

export default function App() {
  return (
    <CleaningSessionProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/clean" element={<DataCleaningPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CleaningSessionProvider>
  )
}
