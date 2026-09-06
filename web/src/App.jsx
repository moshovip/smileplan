import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './stores/useStore'
import Layout from './components/Layout/Layout'
import Onboarding from './components/Onboarding/Onboarding'
import Dashboard from './pages/Dashboard'
import { PatientList, PatientNew, PatientDetail } from './pages/Patients'
import PriceListPage from './pages/PriceListPage'
import EstimatePage from './pages/EstimatePage'
import SettingsPage from './pages/SettingsPage'
import CalendarPage from './pages/CalendarPage'

export default function App() {
  const init = useStore(s => s.init)
  const isLoaded = useStore(s => s.isLoaded)
  const settings = useStore(s => s.settings)
  const updateSettings = useStore(s => s.updateSettings)

  useEffect(() => {
    init()
  }, [])

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🦷</div>
          <p className="text-brand-700 font-medium">Загрузка SmilePlan...</p>
        </div>
      </div>
    )
  }

  if (!settings.onboardingDone) {
    return <Onboarding onDone={() => updateSettings({ onboardingDone: true })} />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/patients" element={<PatientList />} />
        <Route path="/patients/new" element={<PatientNew />} />
        <Route path="/patients/:id" element={<PatientDetail />} />
        <Route path="/patients/:id/estimate/:estimateId" element={<EstimatePage />} />
        <Route path="/price-list" element={<PriceListPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
