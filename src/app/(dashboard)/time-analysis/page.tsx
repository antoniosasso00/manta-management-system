'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Tab,
  Tabs,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  Schedule,
  Search,
  Refresh,
  AccessTime,
  Timer,
  HourglassEmpty
} from '@mui/icons-material'
import { DataTable } from '@/components/atoms'

interface DepartmentTimeData {
  departmentId: string
  departmentName: string
  departmentCode: string
  advancementTime: number | null
  workingTime: number | null
  waitingTime: number | null
}

interface ODLTimeAnalysis {
  odlId: string
  odlNumber: string
  partNumber: string
  departmentTimes: DepartmentTimeData[]
  totalTime: number
}

interface PartTimeAnalysis {
  partNumber: string
  partDescription: string
  odlCount: number
  avgDepartmentTimes: DepartmentTimeData[]
  avgTotalTime: number
}

interface OverviewResponse {
  view: 'odl' | 'part'
  data: ODLTimeAnalysis[] | PartTimeAnalysis[]
  pagination: {
    limit: number
    offset: number
    hasMore: boolean
  }
}

export default function TimeAnalysisPage() {
  const [currentTab, setCurrentTab] = useState<'odl' | 'part'>('odl')
  const [data, setData] = useState<ODLTimeAnalysis[] | PartTimeAnalysis[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)

  const fetchData = async (view: 'odl' | 'part') => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/time-analysis/overview?view=${view}&limit=100`)
      if (!response.ok) throw new Error('Errore nel caricamento dati')
      
      const result: OverviewResponse = await response.json()
      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(currentTab)
  }, [currentTab])

  const handleTabChange = (_: React.SyntheticEvent, newValue: 'odl' | 'part') => {
    setCurrentTab(newValue)
  }

  const formatTime = (minutes: number | null): string => {
    if (minutes === null || minutes === 0) return '-'
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const getTimeChip = (time: number | null, type: 'advancement' | 'working' | 'waiting') => {
    if (time === null) return <Chip label="-" size="small" variant="outlined" />
    
    const colors = {
      advancement: 'primary',
      working: 'success',
      waiting: 'warning'
    } as const
    
    const icons = {
      advancement: <AccessTime fontSize="small" />,
      working: <Timer fontSize="small" />,
      waiting: <HourglassEmpty fontSize="small" />
    }
    
    return (
      <Chip
        label={formatTime(time)}
        size="small"
        color={colors[type]}
        icon={icons[type]}
        variant="filled"
      />
    )
  }

  // Filtro dati in base alla ricerca
  const filteredData = data.filter(item => {
    const searchLower = searchTerm.toLowerCase()
    if (currentTab === 'odl') {
      const odlItem = item as ODLTimeAnalysis
      return (
        odlItem.odlNumber.toLowerCase().includes(searchLower) ||
        odlItem.partNumber.toLowerCase().includes(searchLower)
      )
    } else {
      const partItem = item as PartTimeAnalysis
      return (
        partItem.partNumber.toLowerCase().includes(searchLower) ||
        partItem.partDescription.toLowerCase().includes(searchLower)
      )
    }
  })

  // Colonne per tabella ODL
  const odlColumns = [
    { 
      id: 'odlNumber' as keyof ODLTimeAnalysis, 
      label: 'ODL', 
      render: (item: ODLTimeAnalysis) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {item.odlNumber}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {item.partNumber}
          </Typography>
        </Box>
      )
    },
    {
      id: 'departmentTimes' as keyof ODLTimeAnalysis,
      label: 'Tempi per Reparto',
      render: (item: ODLTimeAnalysis) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {item.departmentTimes.map(dept => (
            <Box key={dept.departmentId} sx={{ minWidth: 120 }}>
              <Typography variant="caption" color="text.secondary">
                {dept.departmentCode}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                {getTimeChip(dept.advancementTime, 'advancement')}
                {getTimeChip(dept.workingTime, 'working')}
                {getTimeChip(dept.waitingTime, 'waiting')}
              </Box>
            </Box>
          ))}
        </Box>
      )
    },
    {
      id: 'totalTime' as keyof ODLTimeAnalysis,
      label: 'Tempo Totale',
      render: (item: ODLTimeAnalysis) => (
        <Typography variant="h6" color="primary">
          {formatTime(item.totalTime)}
        </Typography>
      )
    }
  ]

  // Colonne per tabella Part Number
  const partColumns = [
    {
      id: 'partNumber' as keyof PartTimeAnalysis,
      label: 'Part Number',
      render: (item: PartTimeAnalysis) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {item.partNumber}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {item.partDescription}
          </Typography>
          <Chip 
            label={`${item.odlCount} ODL`} 
            size="small" 
            variant="outlined"
            sx={{ mt: 0.5 }}
          />
        </Box>
      )
    },
    {
      id: 'avgDepartmentTimes' as keyof PartTimeAnalysis,
      label: 'Tempi Medi per Reparto',
      render: (item: PartTimeAnalysis) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {item.avgDepartmentTimes.map(dept => (
            <Box key={dept.departmentId} sx={{ minWidth: 120 }}>
              <Typography variant="caption" color="text.secondary">
                {dept.departmentCode}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                {getTimeChip(dept.advancementTime, 'advancement')}
                {getTimeChip(dept.workingTime, 'working')}
                {getTimeChip(dept.waitingTime, 'waiting')}
              </Box>
            </Box>
          ))}
        </Box>
      )
    },
    {
      id: 'avgTotalTime' as keyof PartTimeAnalysis,
      label: 'Tempo Medio Totale',
      render: (item: PartTimeAnalysis) => (
        <Typography variant="h6" color="primary">
          {formatTime(Math.round(item.avgTotalTime))}
        </Typography>
      )
    }
  ]

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Schedule />
            Analisi Tempi
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitoraggio tempi di produzione per ODL e Part Number
          </Typography>
        </Box>
        <Tooltip title="Ricarica dati">
          <IconButton onClick={() => fetchData(currentTab)} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Legenda */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Legenda Tempi
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getTimeChip(120, 'advancement')}
                <Typography variant="body2">
                  <strong>Avanzamento:</strong> Tempo totale ENTRY → EXIT (include pause)
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getTimeChip(90, 'working')}
                <Typography variant="body2">
                  <strong>Lavorazione:</strong> Tempo effettivo (esclude pause)
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getTimeChip(30, 'waiting')}
                <Typography variant="body2">
                  <strong>Attesa:</strong> Tempo tra EXIT reparto precedente e ENTRY corrente
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="Analisi per ODL" value="odl" />
          <Tab label="Analisi per Part Number" value="part" />
        </Tabs>
      </Box>

      {/* Filtri */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder={currentTab === 'odl' ? 'Cerca per ODL o Part Number...' : 'Cerca per Part Number...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            )
          }}
          sx={{ maxWidth: 400 }}
        />
      </Box>

      {/* Contenuto */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Card>
          <CardContent>
            {filteredData.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary">
                  {data.length === 0 ? 'Nessun dato disponibile' : 'Nessun risultato trovato'}
                </Typography>
                {data.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    I dati delle metriche temporali verranno generati automaticamente 
                    quando vengono registrati eventi di produzione.
                  </Typography>
                )}
              </Box>
            ) : (
              <DataTable
                data={filteredData as unknown as Record<string, unknown>[]}
                columns={currentTab === 'odl' ? odlColumns : partColumns}
                loading={loading}
                totalCount={filteredData.length}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={setPage}
                onRowsPerPageChange={setRowsPerPage}
              />
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  )
}