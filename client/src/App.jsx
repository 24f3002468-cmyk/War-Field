import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useStore } from './store'
import Sidebar from './components/Sidebar'
import { GlobalTimerBar } from './pages/Timers'
import AuthPage from './pages/Auth'
import Dashboard from './pages/Dashboard'
import DailyLog from './pages/DailyLog'
import DSATracker from './pages/DSATracker'
import Applications from './pages/Applications'
import Analytics from './pages/Analytics'
import Timers from './pages/Timers'
import Tasks from './pages/Tasks'
import Schedule from './pages/Schedule'
import Roadmap from './pages/Roadmap'
import { Projects, Goals, Audit, Principles } from './pages/OtherPages'

function Layout() {
  const { activeTimer } = useStore()
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className={`flex-1 overflow-y-auto min-h-screen ${activeTimer ? 'pt-8' : ''}`}>
        <GlobalTimerBar />
        <Outlet />
      </main>
    </div>
  )
}

function RequireAuth() {
  const { token } = useStore()
  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/daily" element={<DailyLog />} />
            <Route path="/dsa" element={<DSATracker />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/timers" element={<Timers />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/principles" element={<Principles />} />
            <Route path="/roadmap" element={<Roadmap />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
