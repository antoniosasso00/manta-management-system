'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseRealTimeUpdatesOptions {
  intervalMs?: number
  enabled?: boolean
  onUpdate?: () => void
  onError?: (error: Error) => void
}

interface UseRealTimeUpdatesReturn {
  isRunning: boolean
  lastUpdate: Date | null
  toggle: () => void
  forceUpdate: () => void
  setEnabled: (enabled: boolean) => void
}

export function useRealTimeUpdates({
  intervalMs = 30000, // 30 secondi (best practice per dashboard)
  enabled = false,
  onUpdate,
  onError
}: UseRealTimeUpdatesOptions = {}): UseRealTimeUpdatesReturn {
  const [isRunning, setIsRunning] = useState(enabled)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const enabledRef = useRef(enabled)
  const onUpdateRef = useRef(onUpdate)
  const onErrorRef = useRef(onError)

  // Update refs quando cambiano le props
  useEffect(() => {
    enabledRef.current = enabled
    setIsRunning(enabled)
  }, [enabled])

  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  const executeUpdate = useCallback(async () => {
    try {
      if (onUpdateRef.current && enabledRef.current) {
        await onUpdateRef.current()
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Errore durante l\'aggiornamento real-time:', error)
      if (onErrorRef.current) {
        onErrorRef.current(error as Error)
      }
    }
  }, [])

  const startInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    intervalRef.current = setInterval(executeUpdate, intervalMs)
    setIsRunning(true)
  }, [executeUpdate, intervalMs])

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsRunning(false)
  }, [])

  const toggle = useCallback(() => {
    if (enabledRef.current) {
      stopInterval()
      enabledRef.current = false
    } else {
      enabledRef.current = true
      startInterval()
    }
  }, [startInterval, stopInterval])

  const forceUpdate = useCallback(() => {
    executeUpdate()
  }, [executeUpdate])

  const setEnabled = useCallback((newEnabled: boolean) => {
    enabledRef.current = newEnabled
    if (newEnabled) {
      startInterval()
    } else {
      stopInterval()
    }
  }, [startInterval, stopInterval])

  // Avvia/ferma interval quando enabled cambia
  useEffect(() => {
    if (enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      intervalRef.current = setInterval(executeUpdate, intervalMs)
      setIsRunning(true)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsRunning(false)
    }

    // Cleanup all'unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, executeUpdate, intervalMs])

  // Pausa aggiornamenti quando tab è in background (performance optimization)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      } else if (!document.hidden && enabledRef.current) {
        intervalRef.current = setInterval(executeUpdate, intervalMs)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [executeUpdate, intervalMs])

  return {
    isRunning,
    lastUpdate,
    toggle,
    forceUpdate,
    setEnabled
  }
}

// Hook specifico per Dashboard KPI
export function useDashboardKPI() {
  const [kpiData, setKpiData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchKPIDataRef = useRef<() => Promise<void>>()

  const fetchKPIData = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/dashboard/kpi')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setKpiData(data)
      setLoading(false)
    } catch (err) {
      console.error('Errore nel fetch KPI:', err)
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
      setLoading(false)
    }
  }, [])

  fetchKPIDataRef.current = fetchKPIData

  const realTimeUpdates = useRealTimeUpdates({
    intervalMs: 30000, // 30 secondi per KPI dashboard
    enabled: true,
    onUpdate: fetchKPIData,
    onError: (error) => setError(error.message)
  })

  // Initial fetch
  useEffect(() => {
    if (fetchKPIDataRef.current) {
      fetchKPIDataRef.current()
    }
  }, [])

  return {
    data: kpiData,
    loading,
    error,
    refresh: fetchKPIData,
    realTime: realTimeUpdates
  }
}

// Hook specifico per Audit Events
export function useAuditEvents() {
  const [auditData, setAuditData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<any>({})
  const fetchAuditDataRef = useRef<() => Promise<void>>()

  const fetchAuditData = useCallback(async () => {
    try {
      setError(null)
      const searchParams = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          searchParams.append(key, String(value))
        }
      })
      
      const response = await fetch(`/api/admin/audit/events?${searchParams}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setAuditData(data)
      setLoading(false)
    } catch (err) {
      console.error('Errore nel fetch audit events:', err)
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
      setLoading(false)
    }
  }, [filters])

  fetchAuditDataRef.current = fetchAuditData

  const realTimeUpdates = useRealTimeUpdates({
    intervalMs: 60000, // 60 secondi per audit events (meno frequente)
    enabled: false, // Disabilitato di default per audit
    onUpdate: fetchAuditData,
    onError: (error) => setError(error.message)
  })

  // Initial fetch
  useEffect(() => {
    if (fetchAuditDataRef.current) {
      fetchAuditDataRef.current()
    }
  }, [])

  // Re-fetch quando cambiano i filtri
  useEffect(() => {
    if (fetchAuditDataRef.current) {
      fetchAuditDataRef.current()
    }
  }, [filters])

  return {
    data: auditData,
    loading,
    error,
    filters,
    setFilters,
    refresh: fetchAuditData,
    realTime: realTimeUpdates
  }
}

// Hook specifico per User Stats
export function useUserStats() {
  const [statsData, setStatsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchStatsDataRef = useRef<() => Promise<void>>()

  const fetchStatsData = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/user/stats')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setStatsData(data)
      setLoading(false)
    } catch (err) {
      console.error('Errore nel fetch user stats:', err)
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
      setLoading(false)
    }
  }, [])

  fetchStatsDataRef.current = fetchStatsData

  const realTimeUpdates = useRealTimeUpdates({
    intervalMs: 120000, // 2 minuti per stats utente
    enabled: false, // Disabilitato di default per stats
    onUpdate: fetchStatsData,
    onError: (error) => setError(error.message)
  })

  // Initial fetch
  useEffect(() => {
    if (fetchStatsDataRef.current) {
      fetchStatsDataRef.current()
    }
  }, [])

  return {
    data: statsData,
    loading,
    error,
    refresh: fetchStatsData,
    realTime: realTimeUpdates
  }
}