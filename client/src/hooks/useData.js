import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'

// Generic fetch hook
export function useFetch(endpoint, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get(endpoint)
      setData(res.data)
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => { fetch() }, [...deps, fetch])

  return { data, loading, error, refetch: fetch, setData }
}

// DSA
export function useDSA() {
  const { data, loading, refetch } = useFetch('/dsa')
  return {
    problems: data?.problems || [],
    topics: data?.topics || [],
    weekCount: data?.weekCount || 0,
    loading,
    refetch,
  }
}

// Applications
export function useApplications() {
  const { data, loading, refetch } = useFetch('/applications')
  return {
    apps: data?.apps || [],
    stats: data?.stats || {},
    weekTotal: data?.weekTotal || 0,
    loading,
    refetch,
  }
}

// Daily logs
export function useLogs() {
  const { data, loading, refetch } = useFetch('/logs')
  return { logs: data || [], loading, refetch }
}

export function useToday() {
  const { data, loading, refetch } = useFetch('/logs/today')
  return { today: data?.log, checklist: data?.checklist || [], loading, refetch }
}

export function useAnalytics() {
  const { data, loading, refetch } = useFetch('/logs/analytics')
  return { scores: data?.scores || [], weekAvg: data?.weekAvg || {}, loading, refetch }
}

// Projects
export function useProjects() {
  const { data, loading, refetch } = useFetch('/projects')
  return { projects: data || [], loading, refetch }
}

// Network
export function useNetwork() {
  const { data, loading, refetch } = useFetch('/network')
  return { contacts: data?.contacts || [], stats: data?.stats || {}, loading, refetch }
}

// Goals
export function useGoals() {
  const { data, loading, refetch } = useFetch('/goals')
  return { goals: data || [], loading, refetch }
}

// Timers
export function useTimers() {
  const { data, loading, refetch } = useFetch('/timers')
  return { timers: data || [], loading, refetch }
}

// Audit
export function useAudit() {
  const { data, loading, refetch } = useFetch('/audit')
  return { computed: data?.computed || {}, saved: data?.saved || [], weekStart: data?.weekStart, loading, refetch }
}
