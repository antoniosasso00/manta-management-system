'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Tooltip
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

  if (loading) {
    return (
      <Box className="p-4">
        <Typography>Caricamento...</Typography>
      </Box>
    )
  }

  return (
    <Box className="p-4 space-y-6">
      {/* Header */}
      <Box className="flex items-center justify-between">
        <Typography variant="h4" className="flex items-center gap-2">
          <Assignment />
          I Miei ODL
        </Typography>
        <Button
          variant="outlined"
          startIcon={<QrCodeScanner />}
          onClick={() => router.push('/qr-scanner')}
        >
          Scanner QR
        </Button>
      </Box>

      {/* Search */}
      <Card>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* ODL Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ODL Assegnati ({filteredODL.length})
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ODL</TableCell>
                  <TableCell>Parte</TableCell>
                  <TableCell>Priorità</TableCell>
                  <TableCell>Quantità</TableCell>
                  <TableCell>Tempo Lavorazione</TableCell>
                  <TableCell>Timer</TableCell>
                  <TableCell>Ultima Scansione</TableCell>
                  <TableCell>Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredODL.map((odl) => (
                  <TableRow key={odl.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {odl.odlNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {odl.partNumber}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {odl.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={odl.priority}
                        color={getPriorityColor(odl.priority)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {odl.quantity}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color={odl.timeInDepartment > 0 ? 'primary' : 'textSecondary'}
                      >
                        {odl.timeInDepartment > 0 ? formatTime(odl.timeInDepartment) : 'Non iniziato'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {odl.isTimerActive ? (
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
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {odl.lastScan ? new Date(odl.lastScan).toLocaleString('it-IT') : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box className="flex gap-1">
                        {odl.isTimerActive ? (
                          <Tooltip title="Ferma timer">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleStopTimer(odl.id)}
                            >
                              <Stop />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Avvia timer">
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={() => handleStartTimer(odl.id)}
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
                    </TableCell>
                  </TableRow>
                ))}
                {filteredODL.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="textSecondary">
                        Nessun ODL assegnato
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  )
}