'use client'

import { useState, useEffect } from 'react'
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
  MenuItem,
  InputAdornment,
  Pagination,
  Skeleton
} from '@mui/material'
import {
  Analytics,
  Search,
  Person,
  Assignment,
  Security,
  AccessTime
} from '@mui/icons-material'

interface AuditLog {
  id: string
  timestamp: string
  userId: string
  userName: string
  action: string
  resource: string
  resourceId?: string
  ipAddress: string
  userAgent: string
  details?: string
  status: 'SUCCESS' | 'FAILURE' | 'WARNING'
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 25

  useEffect(() => {
    loadAuditLogs()
  }, [page])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, actionFilter, statusFilter, logs])

  const loadAuditLogs = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/audit?page=${page}&limit=${itemsPerPage}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs)
        setTotalPages(data.totalPages)
      } else {
        // Dati mock per sviluppo
        const mockLogs: AuditLog[] = [
          {
            id: '1',
            timestamp: new Date().toISOString(),
            userId: 'user1',
            userName: 'Mario Rossi',
            action: 'LOGIN',
            resource: 'AUTH',
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0...',
            status: 'SUCCESS'
          },
          {
            id: '2',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            userId: 'user1',
            userName: 'Mario Rossi',
            action: 'QR_SCAN',
            resource: 'ODL',
            resourceId: 'ODL-2024-001',
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0...',
            details: 'Entry scan for Clean Room',
            status: 'SUCCESS'
          },
          {
            id: '3',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            userId: 'admin1',
            userName: 'Admin User',
            action: 'USER_CREATE',
            resource: 'USER',
            resourceId: 'user123',
            ipAddress: '192.168.1.50',
            userAgent: 'Mozilla/5.0...',
            details: 'Created new operator account',
            status: 'SUCCESS'
          },
          {
            id: '4',
            timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            userId: 'user2',
            userName: 'Luigi Verdi',
            action: 'LOGIN_FAILED',
            resource: 'AUTH',
            ipAddress: '192.168.1.200',
            userAgent: 'Mozilla/5.0...',
            details: 'Invalid password',
            status: 'FAILURE'
          },
          {
            id: '5',
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            userId: 'user1',
            userName: 'Mario Rossi',
            action: 'ODL_UPDATE',
            resource: 'ODL',
            resourceId: 'ODL-2024-002',
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0...',
            details: 'Status changed from IN_CLEANROOM to CLEANROOM_COMPLETED',
            status: 'SUCCESS'
          }
        ]
        setLogs(mockLogs)
        setTotalPages(1)
      }
    } catch (error) {
      console.error('Error loading audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...logs]

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.resourceId && log.resourceId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        log.ipAddress.includes(searchTerm)
      )
    }

    if (actionFilter) {
      filtered = filtered.filter(log => log.action === actionFilter)
    }

    if (statusFilter) {
      filtered = filtered.filter(log => log.status === statusFilter)
    }

    setFilteredLogs(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'success'
      case 'FAILURE': return 'error'
      case 'WARNING': return 'warning'
      default: return 'default'
    }
  }

  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN')) return <Person />
    if (action.includes('ODL') || action.includes('QR')) return <Assignment />
    if (action.includes('USER') || action.includes('ADMIN')) return <Security />
    return <Analytics />
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('it-IT')
  }

  if (loading) {
    return (
      <Box className="p-4 space-y-4">
        <Skeleton variant="rectangular" height={60} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    )
  }

  return (
    <Box className="p-4 space-y-6">
      {/* Header */}
      <Box className="flex items-center justify-between">
        <Typography variant="h4" className="flex items-center gap-2">
          <Analytics />
          Audit Logs
        </Typography>
      </Box>

      {/* Filters */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filtri
          </Typography>
          <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TextField
              fullWidth
              placeholder="Cerca per utente, azione, risorsa, IP..."
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
            <TextField
              select
              fullWidth
              label="Azione"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <MenuItem value="">Tutte le azioni</MenuItem>
              <MenuItem value="LOGIN">Login</MenuItem>
              <MenuItem value="LOGIN_FAILED">Login Fallito</MenuItem>
              <MenuItem value="LOGOUT">Logout</MenuItem>
              <MenuItem value="QR_SCAN">Scansione QR</MenuItem>
              <MenuItem value="ODL_CREATE">Creazione ODL</MenuItem>
              <MenuItem value="ODL_UPDATE">Aggiornamento ODL</MenuItem>
              <MenuItem value="USER_CREATE">Creazione Utente</MenuItem>
              <MenuItem value="USER_UPDATE">Aggiornamento Utente</MenuItem>
            </TextField>
            <TextField
              select
              fullWidth
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">Tutti gli stati</MenuItem>
              <MenuItem value="SUCCESS">Successo</MenuItem>
              <MenuItem value="FAILURE">Fallimento</MenuItem>
              <MenuItem value="WARNING">Warning</MenuItem>
            </TextField>
          </Box>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Log Eventi ({filteredLogs.length})
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Utente</TableCell>
                  <TableCell>Azione</TableCell>
                  <TableCell>Risorsa</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Dettagli</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      <Box className="flex items-center gap-1">
                        <AccessTime fontSize="small" color="action" />
                        <Typography variant="body2">
                          {formatTimestamp(log.timestamp)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {log.userName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {log.userId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box className="flex items-center gap-1">
                        {getActionIcon(log.action)}
                        <Typography variant="body2">
                          {log.action}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {log.resource}
                      </Typography>
                      {log.resourceId && (
                        <Typography variant="caption" color="textSecondary">
                          {log.resourceId}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {log.ipAddress}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.status}
                        color={getStatusColor(log.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {log.details || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="textSecondary">
                        Nessun log trovato
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box className="flex justify-center mt-4">
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}