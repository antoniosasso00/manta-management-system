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

  // Update ref quando enabled cambia
  useEffect(() => {
    enabledRef.current = enabled
    setIsRunning(enabled)
  }, [enabled])

  const executeUpdate = useCallback(async () => {
    try {
      if (onUpdate && enabledRef.current) {
        await onUpdate()
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Errore durante l\'aggiornamento real-time:', error)
      if (onError) {
        onError(error as Error)
      }
    }
  }, [onUpdate, onError])

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
    if (isRunning) {
      stopInterval()
      enabledRef.current = false
    } else {
      enabledRef.current = true
      startInterval()
    }
  }, [isRunning, startInterval, stopInterval])

  const forceUpdate = useCallback(() => {
    executeUpdate()
  }, [executeUpdate])

  const setEnabled = useCallback((newEnabled: boolean) => {
    enabledRef.current = newEnabled
    if (newEnabled && !isRunning) {
      startInterval()
    } else if (!newEnabled && isRunning) {
      stopInterval()
    }
  }, [isRunning, startInterval, stopInterval])

  // Avvia/ferma interval quando enabled cambia
  useEffect(() => {
    if (enabled) {
      startInterval()
    } else {
      stopInterval()
    }

    // Cleanup all'unmount
    return () => {
      stopInterval()
    }
  }, [enabled, startInterval, stopInterval])

  // Pausa aggiornamenti quando tab è in background (performance optimization)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRunning) {
        stopInterval()
      } else if (!document.hidden && enabledRef.current) {
        startInterval()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isRunning, startInterval, stopInterval])

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

  const realTimeUpdates = useRealTimeUpdates({
    intervalMs: 30000, // 30 secondi per KPI dashboard
    enabled: true,
    onUpdate: fetchKPIData,
    onError: (error) => setError(error.message)
  })

  // Initial fetch
  useEffect(() => {
    fetchKPIData()
  }, []) // Rimuoviamo fetchKPIData per evitare loop infinito

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

  const realTimeUpdates = useRealTimeUpdates({
    intervalMs: 60000, // 60 secondi per audit events (meno frequente)
    enabled: false, // Disabilitato di default per audit
    onUpdate: fetchAuditData,
    onError: (error) => setError(error.message)
  })

  // Initial fetch
  useEffect(() => {
    fetchAuditData()
  }, []) // Rimuoviamo fetchAuditData per evitare loop infinito

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

  const realTimeUpdates = useRealTimeUpdates({
    intervalMs: 120000, // 2 minuti per stats utente
    enabled: false, // Disabilitato di default per stats
    onUpdate: fetchStatsData,
    onError: (error) => setError(error.message)
  })

  // Initial fetch
  useEffect(() => {
    fetchStatsData()
  }, []) // Rimuoviamo fetchStatsData per evitare loop infinito

  return {
    data: statsData,
    loading,
    error,
    refresh: fetchStatsData,
    realTime: realTimeUpdates
  }
}