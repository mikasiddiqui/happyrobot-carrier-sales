import { useEffect, useState } from 'react'

import {
  fetchDashboardSummary,
  fetchHealth,
  fetchLoads,
  fetchRecentCalls,
  resetSavedCalls,
} from '../lib/api'
import type { DashboardPayload, HealthResponse } from '../types'

const emptyDashboard: DashboardPayload = {
  summary: null,
  calls: [],
  loads: [],
}

export function useDashboardData() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [dashboard, setDashboard] = useState<DashboardPayload>(emptyDashboard)
  const [dashboardError, setDashboardError] = useState('')
  const [dashboardLoading, setDashboardLoading] = useState(true)

  async function refreshDashboard() {
    try {
      const [nextHealth, summary, calls, loads] = await Promise.all([
        fetchHealth(),
        fetchDashboardSummary(),
        fetchRecentCalls(),
        fetchLoads(),
      ])

      setHealth(nextHealth)
      setDashboard({
        summary,
        calls,
        loads,
      })
      setDashboardError('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Dashboard load failed.'
      setDashboardError(message)
    }
  }

  async function clearSavedCalls() {
    setDashboardLoading(true)
    setDashboardError('')

    try {
      await resetSavedCalls()
      setDashboard(emptyDashboard)
      await refreshDashboard()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not reset saved calls.'
      setDashboardError(message)
      setDashboardLoading(false)
    }
  }

  useEffect(() => {
    async function loadInitialDashboard() {
      setDashboardLoading(true)
      await refreshDashboard()
      setDashboardLoading(false)
    }

    void loadInitialDashboard()
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshDashboard()
    }, 1_000)

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void refreshDashboard()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return {
    health,
    dashboard,
    dashboardError,
    dashboardLoading,
    refreshDashboard,
    clearSavedCalls,
  }
}
