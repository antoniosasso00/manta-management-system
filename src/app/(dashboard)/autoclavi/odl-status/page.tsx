'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress,
  Button,
  IconButton,
  Breadcrumbs,
  Link,
  Alert
} from '@mui/material'
import { 
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  QrCodeScanner as QrCodeScannerIcon
} from '@mui/icons-material'
import NextLink from 'next/link'
import { DepartmentODLList } from '@/components/organisms'
import { DepartmentODLList as DepartmentODLListType, CreateManualEvent } from '@/domains/production'
import { useRouter } from 'next/navigation'

interface Department {
  id: string
  code: string
  name: string
  type: string
}

export default function AutoclaveODLStatusPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<DepartmentODLListType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [departmentsLoaded, setDepartmentsLoaded] = useState(false)
  const [autoclaveDepartmentId, setAutoclaveDepartmentId] = useState<string | null>(null)

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await fetch('/api/departments')
      if (!response.ok) throw new Error('Errore nel caricamento dei reparti')
      const data = await response.json()
      
      // L'API restituisce { departments: [...] }
      if (data && Array.isArray(data.departments)) {
        setDepartments(data.departments)
        const autoclaveDepr = data.departments.find((dept: Department) => dept.type === 'AUTOCLAVE')
        if (autoclaveDepr) {
          setAutoclaveDepartmentId(autoclaveDepr.id)
        }
      } else if (Array.isArray(data)) {
        setDepartments(data)
        const autoclaveDepr = data.find((dept: Department) => dept.type === 'AUTOCLAVE')
        if (autoclaveDepr) {
          setAutoclaveDepartmentId(autoclaveDepr.id)
        }
      } else {
        console.error('Formato risposta API non valido:', data)
        setDepartments([])
      }
      setDepartmentsLoaded(true)
    } catch (err) {
      console.error('Errore caricamento reparti:', err)
      setError('Errore nel caricamento dei reparti')
      setDepartments([])
      setDepartmentsLoaded(true)
    }
  }, [])

  const fetchData = useCallback(async () => {
    if (!autoclaveDepartmentId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/production/odl/department/${autoclaveDepartmentId}`)
      if (!response.ok) throw new Error('Errore nel caricamento dei dati')
      const data = await response.json()
      setData(data)
      setError(null)
    } catch (err) {
      console.error('Errore caricamento dati:', err)
      setError('Errore nel caricamento dei dati')
    } finally {
      setLoading(false)
    }
  }, [autoclaveDepartmentId])

  useEffect(() => {
    fetchDepartments()
  }, [fetchDepartments])

  useEffect(() => {
    if (autoclaveDepartmentId) {
      fetchData()
      // Auto-refresh ogni 30 secondi
      const interval = setInterval(fetchData, 30000)
      return () => clearInterval(interval)
    }
  }, [autoclaveDepartmentId, fetchData])

  const handleTrackingEvent = async (data: CreateManualEvent) => {
    try {
      const response = await fetch('/api/production/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) throw new Error('Errore nella registrazione evento')
      
      await fetchData()
    } catch (err) {
      console.error('Errore registrazione evento:', err)
      setError('Errore nella registrazione evento')
    }
  }

  const handleScanQR = () => {
    router.push('/qr-scanner')
  }

  if (status === 'loading' || !departmentsLoaded) {
    return (
      <Box className="flex items-center justify-center min-h-screen">
        <CircularProgress />
      </Box>
    )
  }

  if (!session) {
    return (
      <Box className="flex items-center justify-center min-h-screen">
        <Typography>Non autorizzato</Typography>
      </Box>
    )
  }

  if (!autoclaveDepartmentId) {
    return (
      <Box className="flex items-center justify-center min-h-screen">
        <Alert severity="error">Reparto Autoclavi non trovato</Alert>
      </Box>
    )
  }

  // Trova il dipartimento per avere i dati completi
  const autoclaveDepartment = departments.find(dept => dept.id === autoclaveDepartmentId)

  return (
    <Box className="min-h-screen bg-gray-50">
      {/* Header */}
      <Paper elevation={0} className="border-b">
        <Box className="px-6 py-4">
          <Box className="flex items-center justify-between mb-4">
            <Box className="flex items-center gap-3">
              <IconButton 
                onClick={() => router.push('/autoclavi/batches')}
                size="small"
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h4" component="h1" fontWeight="bold">
                Stato ODL - Autoclavi
              </Typography>
            </Box>
            <Box className="flex items-center gap-2">
              <Button
                variant="outlined"
                startIcon={<QrCodeScannerIcon />}
                onClick={handleScanQR}
              >
                Scansiona QR
              </Button>
              <IconButton 
                onClick={fetchData}
                disabled={loading}
                size="large"
              >
                <RefreshIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Breadcrumbs */}
          <Breadcrumbs aria-label="breadcrumb">
            <Link 
              component={NextLink} 
              href="/dashboard" 
              underline="hover" 
              color="inherit"
            >
              Dashboard
            </Link>
            <Link 
              component={NextLink} 
              href="/autoclavi/batches" 
              underline="hover" 
              color="inherit"
            >
              Autoclavi
            </Link>
            <Typography color="text.primary">Stato ODL</Typography>
          </Breadcrumbs>
        </Box>
      </Paper>

      {/* Content */}
      <Box className="p-6">
        <Paper elevation={0} className="p-4 mb-4 bg-blue-50 border border-blue-200">
          <Typography variant="body1" color="primary">
            <strong>Nota:</strong> Questa vista mostra tutti gli ODL nel reparto Autoclavi organizzati per stato, 
            indipendentemente dai batch. Per la gestione dei batch, usa la vista principale Autoclavi.
          </Typography>
        </Paper>

        <DepartmentODLList
          departmentId={autoclaveDepartmentId}
          departmentCode={autoclaveDepartment?.code || 'AC'}
          departmentName={autoclaveDepartment?.name || 'Autoclavi'}
          data={data || undefined}
          loading={loading}
          error={error || undefined}
          onTrackingEvent={handleTrackingEvent}
          onRefresh={fetchData}
        />
      </Box>
    </Box>
  )
}