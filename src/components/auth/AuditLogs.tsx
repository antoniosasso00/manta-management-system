'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Pagination,
  Card,
  CardContent,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material'
import {
  // Search as SearchIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material'
import { AuditAction } from '@prisma/client'

interface AuditLog {
  id: string
  action: AuditAction
  resource: string
  resourceId: string | null
  userId: string
  userEmail: string
  details: Record<string, unknown>
  ipAddress: string | null
  userAgent: string | null
  timestamp: string
  user: {
    name: string | null
    email: string
  }
}

interface AuditFilters {
  action: string
  resource: string
  userId: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function AuditLogs() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  
  // Filters and pagination
  const [filters, setFilters] = useState<AuditFilters>({
    action: '',
    resource: '',
    userId: ''
  })
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    fetchAuditLogs()
  }, [filters, pagination.page, pagination.limit])

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value) acc[key] = value
          return acc
        }, {} as Record<string, string>)
      })
      
      const response = await fetch(`/api/admin/audit-logs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAuditLogs(data.auditLogs)
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }))
      } else {
        setError('Errore nel caricamento dei log di audit')
      }
    } catch {
      setError('Errore di connessione')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof AuditFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const clearFilters = () => {
    setFilters({ action: '', resource: '', userId: '' })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const getActionColor = (action: AuditAction) => {
    const colors = {
      CREATE: 'success',
      UPDATE: 'info',
      DELETE: 'error',
      BULK_UPDATE: 'warning',
      BULK_DELETE: 'error',
      EXPORT: 'info',
      IMPORT: 'success',
      LOGIN: 'default',
      LOGOUT: 'default',
      PASSWORD_RESET: 'warning',
    } as const
    return colors[action] || 'default'
  }

  const getActionLabel = (action: AuditAction) => {
    const labels = {
      CREATE: 'Creazione',
      UPDATE: 'Modifica',
      DELETE: 'Eliminazione',
      BULK_UPDATE: 'Modifica Bulk',
      BULK_DELETE: 'Eliminazione Bulk',
      EXPORT: 'Export',
      IMPORT: 'Import',
      LOGIN: 'Login',
      LOGOUT: 'Logout',
      PASSWORD_RESET: 'Reset Password',
    }
    return labels[action] || action
  }

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log)
    setDetailsOpen(true)
  }

  if (loading && auditLogs.length === 0) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography>Caricamento audit logs...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Azione</InputLabel>
                <Select
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  label="Azione"
                >
                  <MenuItem value="">Tutte</MenuItem>
                  <MenuItem value="CREATE">Creazione</MenuItem>
                  <MenuItem value="UPDATE">Modifica</MenuItem>
                  <MenuItem value="DELETE">Eliminazione</MenuItem>
                  <MenuItem value="BULK_UPDATE">Modifica Bulk</MenuItem>
                  <MenuItem value="BULK_DELETE">Eliminazione Bulk</MenuItem>
                  <MenuItem value="EXPORT">Export</MenuItem>
                  <MenuItem value="IMPORT">Import</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Risorsa</InputLabel>
                <Select
                  value={filters.resource}
                  onChange={(e) => handleFilterChange('resource', e.target.value)}
                  label="Risorsa"
                >
                  <MenuItem value="">Tutte</MenuItem>
                  <MenuItem value="User">Utenti</MenuItem>
                  <MenuItem value="Department">Reparti</MenuItem>
                  <MenuItem value="ODL">ODL</MenuItem>
                  <MenuItem value="Part">Parti</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                label="User ID"
                placeholder="ID utente..."
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                size="small"
              >
                Pulisci
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Azione</TableCell>
                <TableCell>Risorsa</TableCell>
                <TableCell>Utente</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell width={100}>Dettagli</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(log.timestamp).toLocaleString('it-IT')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getActionLabel(log.action)}
                      color={getActionColor(log.action)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {log.resource}
                      {log.resourceId && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          ID: {log.resourceId}
                        </Typography>
                      )}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {log.user.name || log.userEmail}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {log.userEmail}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {log.ipAddress || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Visualizza dettagli">
                      <IconButton
                        onClick={() => handleViewDetails(log)}
                        size="small"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {auditLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary" py={4}>
                      {loading ? 'Caricamento...' : 'Nessun log di audit trovato'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
          <Typography variant="body2" color="text.secondary">
            Totale: {pagination.total} log
          </Typography>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      </Paper>

      {/* Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Dettagli Audit Log</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2">Azione:</Typography>
                  <Chip
                    label={getActionLabel(selectedLog.action)}
                    color={getActionColor(selectedLog.action)}
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2">Timestamp:</Typography>
                  <Typography variant="body2">
                    {new Date(selectedLog.timestamp).toLocaleString('it-IT')}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2">Risorsa:</Typography>
                  <Typography variant="body2">{selectedLog.resource}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2">Resource ID:</Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {selectedLog.resourceId || '-'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2">Utente:</Typography>
                  <Typography variant="body2">
                    {selectedLog.user.name || selectedLog.userEmail}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2">IP Address:</Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {selectedLog.ipAddress || '-'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2">User Agent:</Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    {selectedLog.userAgent || '-'}
                  </Typography>
                </Grid>
                {selectedLog.details && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2">Dettagli:</Typography>
                    <Paper sx={{ p: 2, mt: 1, bgcolor: 'grey.50' }}>
                      <pre style={{ 
                        whiteSpace: 'pre-wrap', 
                        fontSize: '0.875rem',
                        margin: 0
                      }}>
                        {JSON.stringify(selectedLog.details, null, 2)}
                      </pre>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}