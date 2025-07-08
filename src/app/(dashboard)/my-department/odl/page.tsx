'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Tooltip,
  Container,
  Grid,
  CircularProgress
} from '@mui/material'
import {
  Assignment,
  Search,
  QrCodeScanner,
  PlayArrow,
  Stop,
  Visibility
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { DataTable, Column } from '@/components/atoms'

interface MyODL {
  id: string
  odlNumber: string
  partNumber: string
  description: string
  status: string
  priority: string
  quantity: number
  timeInDepartment: number
  isTimerActive: boolean
  lastScan?: string
}

export default function MyDepartmentODLPage() {
  const router = useRouter()
  const [odlList, setOdlList] = useState<MyODL[]>([])
  const [filteredODL, setFilteredODL] = useState<MyODL[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  const applyFilters = useCallback(() => {
    let filtered = [...odlList]

    if (searchTerm) {
      filtered = filtered.filter(odl =>
        odl.odlNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        odl.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        odl.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredODL(filtered)
  }, [odlList, searchTerm])

  useEffect(() => {
    loadMyODL()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, odlList, applyFilters])

  const loadMyODL = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/my-department/odl')
      if (response.ok) {
        const data = await response.json()
        setOdlList(data)
      } else {
        // Dati mock per sviluppo
        setOdlList([
          {
            id: '1',
            odlNumber: 'ODL-2024-001',
            partNumber: '8G5350A01',
            description: 'Pannello laterale carbonio',
            status: 'IN_CLEANROOM',
            priority: 'HIGH',
            quantity: 2,
            timeInDepartment: 125,
            isTimerActive: true,
            lastScan: new Date(Date.now() - 125 * 60 * 1000).toISOString()
          },
          {
            id: '2',
            odlNumber: 'ODL-2024-003',
            partNumber: '8G5350C03',
            description: 'Rivestimento interno',
            status: 'IN_CLEANROOM',
            priority: 'NORMAL',
            quantity: 4,
            timeInDepartment: 45,
            isTimerActive: false,
            lastScan: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          }
        ])
      }
    } catch (error) {
      console.error('Error loading my ODL:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartTimer = async (odlId: string) => {
    try {
      await fetch(`/api/my-department/odl/${odlId}/start-timer`, {
        method: 'POST'
      })
      loadMyODL()
    } catch (error) {
      console.error('Error starting timer:', error)
    }
  }

  const handleStopTimer = async (odlId: string) => {
    try {
      await fetch(`/api/my-department/odl/${odlId}/stop-timer`, {
        method: 'POST'
      })
      loadMyODL()
    } catch (error) {
      console.error('Error stopping timer:', error)
    }
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'error'
      case 'HIGH': return 'warning'
      case 'NORMAL': return 'info'
      case 'LOW': return 'success'
      default: return 'default'
    }
  }

  // Configurazione colonne per DataTable
  const columns: Column<MyODL>[] = [
    {
      id: 'odlNumber',
      label: 'ODL',
      mobilePriority: 'always',
      format: (value) => (
        <Typography variant="body2" fontWeight="bold">
          {value as string}
        </Typography>
      )
    },
    {
      id: 'partNumber',
      label: 'Parte',
      mobilePriority: 'always',
      format: (value, row) => (
        <Box>
          <Typography variant="body2">
            {value as string}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {row.description}
          </Typography>
        </Box>
      )
    },
    {
      id: 'priority',
      label: 'Priorità',
      mobilePriority: 'expanded',
      format: (value) => (
        <Chip
          label={value as string}
          color={getPriorityColor(value as string)}
          size="small"
        />
      )
    },
    {
      id: 'quantity',
      label: 'Quantità',
      mobileLabel: 'Qtà',
      mobilePriority: 'expanded',
      align: 'right'
    },
    {
      id: 'timeInDepartment',
      label: 'Tempo Lavorazione',
      mobileLabel: 'Tempo',
      mobilePriority: 'always',
      format: (value) => (
        <Typography 
          variant="body2" 
          color={(value as number) > 0 ? 'primary' : 'textSecondary'}
        >
          {(value as number) > 0 ? formatTime(value as number) : 'Non iniziato'}
        </Typography>
      )
    },
    {
      id: 'isTimerActive',
      label: 'Timer',
      mobilePriority: 'always',
      format: (value) => (
        value ? (
          <Chip
            label="ATTIVO"
            color="success"
            size="small"
            icon={<PlayArrow />}
          />
        ) : (
          <Chip
            label="FERMO"
            color="default"
            size="small"
            icon={<Stop />}
          />
        )
      )
    },
    {
      id: 'lastScan',
      label: 'Ultima Scansione',
      mobileLabel: 'Scan',
      mobilePriority: 'expanded',
      format: (value) => (
        <Typography variant="body2" color="textSecondary">
          {value ? new Date(value as string).toLocaleString('it-IT') : '-'}
        </Typography>
      )
    },
    {
      id: 'id',
      label: 'Azioni',
      mobilePriority: 'always',
      align: 'center',
      format: (value, row) => (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          {row.isTimerActive ? (
            <Tooltip title="Ferma timer">
              <IconButton 
                size="small" 
                color="error"
                onClick={(e) => {
                  e.stopPropagation()
                  handleStopTimer(row.id)
                }}
              >
                <Stop />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Avvia timer">
              <IconButton 
                size="small" 
                color="success"
                onClick={(e) => {
                  e.stopPropagation()
                  handleStartTimer(row.id)
                }}
              >
                <PlayArrow />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Visualizza dettagli">
            <IconButton size="small">
              <Visibility />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ]


  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assignment />
            I Miei ODL
          </Typography>
          <Button
            variant="outlined"
            startIcon={<QrCodeScanner />}
            onClick={() => router.push('/qr-scanner')}
            sx={{ minHeight: 44 }}
          >
            Scanner QR
          </Button>
        </Box>

        {/* Search */}
        <Paper sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Cerca ODL, parte, descrizione..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        {/* ODL Table */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6">
              ODL Assegnati ({filteredODL.length})
            </Typography>
          </Box>
          
          <DataTable
            columns={columns}
            data={filteredODL}
            loading={loading}
            totalCount={filteredODL.length}
            page={0}
            rowsPerPage={filteredODL.length}
            onPageChange={() => {}}
            onRowsPerPageChange={() => {}}
            emptyMessage="Nessun ODL assegnato"
            mobileView="cards"
          />
        </Paper>
      </Box>
    </Container>
  )
}