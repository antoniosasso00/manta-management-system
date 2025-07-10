'use client'

import React, { useState, useMemo } from 'react'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  IconButton,
  Tooltip,
  Typography,
  Chip,
  Stack,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  TablePagination,
  Alert
} from '@mui/material'
import { 
  MoreVert, 
  QrCode, 
  Timer, 
  Engineering,
  PlayArrow,
  Stop,
  Pause,
  PlayCircle,
  ExpandMore,
  ExpandLess,
  AdminPanelSettings
} from '@mui/icons-material'
import { StatusChip, ActionButton } from '@/components/atoms'
import { ODLCard } from '@/components/molecules'
import { QRDisplayModal } from '@/components/molecules/QRDisplayModal'
import { ODLTrackingStatus } from '@/domains/production'
import { EventType } from '@prisma/client'
import { formatTime } from '@/utils/formatters'
import { useAuth } from '@/hooks/useAuth'

interface ODLDataTableProps {
  odls: ODLTrackingStatus[]
  onAction: (odlId: string, actionType: EventType) => void
  onAdvancedWorkflow?: (odl: ODLTrackingStatus) => void
  loading?: boolean
  departmentCode?: string
}

type OrderBy = 'odlNumber' | 'partNumber' | 'priority' | 'status' | 'timeInDepartment'
type Order = 'asc' | 'desc'

export function ODLDataTable({ 
  odls, 
  onAction, 
  onAdvancedWorkflow,
  loading = false,
  departmentCode
}: ODLDataTableProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { user } = useAuth()
  const isSupervisor = user?.role === 'ADMIN' || user?.role === 'SUPERVISOR'
  
  const [order, setOrder] = useState<Order>('asc')
  const [orderBy, setOrderBy] = useState<OrderBy>('odlNumber')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedODL, setSelectedODL] = useState<ODLTrackingStatus | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [qrModalODL, setQrModalODL] = useState<ODLTrackingStatus | null>(null)

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, odl: ODLTrackingStatus) => {
    setAnchorEl(event.currentTarget)
    setSelectedODL(odl)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedODL(null)
  }

  const toggleRowExpand = (odlId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(odlId)) {
      newExpanded.delete(odlId)
    } else {
      newExpanded.add(odlId)
    }
    setExpandedRows(newExpanded)
  }

  const getAvailableActions = (odl: ODLTrackingStatus): EventType[] => {
    const completedStates = [
      'CLEANROOM_COMPLETED', 'AUTOCLAVE_COMPLETED', 'CONTROLLO_NUMERICO_COMPLETED',
      'NDI_COMPLETED', 'MONTAGGIO_COMPLETED', 'VERNICIATURA_COMPLETED',
      'CONTROLLO_QUALITA_COMPLETED', 'COMPLETED'
    ]
    
    if (completedStates.includes(odl.status)) {
      return []
    }
    
    if (!odl.lastEvent) return ['ENTRY']
    
    switch (odl.lastEvent.eventType) {
      case 'ENTRY':
        return ['EXIT', 'PAUSE']
      case 'EXIT':
        return []
      case 'PAUSE':
        return ['RESUME']
      case 'RESUME':
        return ['EXIT', 'PAUSE']
      default:
        return ['ENTRY']
    }
  }

  const sortedODLs = useMemo(() => {
    const comparator = (a: ODLTrackingStatus, b: ODLTrackingStatus) => {
      let aValue: any, bValue: any
      
      switch (orderBy) {
        case 'odlNumber':
          aValue = a.odlNumber
          bValue = b.odlNumber
          break
        case 'partNumber':
          aValue = a.part.partNumber
          bValue = b.part.partNumber
          break
        case 'priority':
          aValue = a.priority
          bValue = b.priority
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'timeInDepartment':
          aValue = a.timeInCurrentDepartment || 0
          bValue = b.timeInCurrentDepartment || 0
          break
        default:
          return 0
      }
      
      if (order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    }
    
    return [...odls].sort(comparator)
  }, [odls, order, orderBy])

  const paginatedODLs = sortedODLs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const getActionIcon = (action: EventType) => {
    switch (action) {
      case 'ENTRY': return <PlayArrow fontSize="small" />
      case 'EXIT': return <Stop fontSize="small" />
      case 'PAUSE': return <Pause fontSize="small" />
      case 'RESUME': return <PlayCircle fontSize="small" />
      default: return null
    }
  }

  // Mobile view - use cards
  if (isMobile) {
    return (
      <Box>
        <Box className="grid grid-cols-1 gap-4 mb-4">
          {paginatedODLs.map((odl) => (
            <ODLCard
              key={odl.id}
              odl={odl}
              onAction={onAction}
              loading={loading}
            />
          ))}
        </Box>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={odls.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="ODL per pagina"
        />
      </Box>
    )
  }

  // Desktop view - use table
  return (
    <Box>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} size="medium">
          <TableHead>
            <TableRow>
              <TableCell width={40} />
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'odlNumber'}
                  direction={orderBy === 'odlNumber' ? order : 'asc'}
                  onClick={() => handleRequestSort('odlNumber')}
                >
                  Numero ODL
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'partNumber'}
                  direction={orderBy === 'partNumber' ? order : 'asc'}
                  onClick={() => handleRequestSort('partNumber')}
                >
                  Part Number
                </TableSortLabel>
              </TableCell>
              <TableCell>Quantità</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'priority'}
                  direction={orderBy === 'priority' ? order : 'asc'}
                  onClick={() => handleRequestSort('priority')}
                >
                  Priorità
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'status'}
                  direction={orderBy === 'status' ? order : 'asc'}
                  onClick={() => handleRequestSort('status')}
                >
                  Stato
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'timeInDepartment'}
                  direction={orderBy === 'timeInDepartment' ? order : 'asc'}
                  onClick={() => handleRequestSort('timeInDepartment')}
                >
                  Tempo nel Reparto
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">Azioni</TableCell>
              <TableCell width={40} />
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedODLs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Alert severity="info" sx={{ justifyContent: 'center' }}>
                    Nessun ODL presente in questo stato
                  </Alert>
                </TableCell>
              </TableRow>
            ) : (
              paginatedODLs.map((odl) => {
                const availableActions = getAvailableActions(odl)
                const isExpanded = expandedRows.has(odl.id)
                const isCompleted = availableActions.length === 0

                return (
                  <React.Fragment key={odl.id}>
                    <TableRow 
                      hover
                      sx={{ 
                        '& > *': { borderBottom: isExpanded ? 'unset' : undefined },
                        bgcolor: isCompleted ? 'success.light' : undefined,
                        opacity: isCompleted ? 0.8 : 1
                      }}
                    >
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => toggleRowExpand(odl.id)}
                        >
                          {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {odl.odlNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {odl.part.partNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {odl.part.description}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Engineering fontSize="small" color="action" />
                          <Typography variant="body2">{odl.quantity}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <StatusChip status={odl.priority} type="priority" />
                      </TableCell>
                      <TableCell>
                        <StatusChip status={odl.status} type="odl" />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Timer fontSize="small" color="action" />
                          <Typography variant="body2">
                            {formatTime(odl.timeInCurrentDepartment || 0)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        {isCompleted ? (
                          <Chip 
                            label="Completato" 
                            color="success" 
                            size="small"
                            icon={<Engineering />}
                          />
                        ) : (
                          <Stack direction="row" spacing={1} justifyContent="center">
                            {availableActions.map((action) => (
                              <Tooltip key={action} title={action}>
                                <IconButton
                                  color={action === 'EXIT' ? 'error' : action === 'ENTRY' ? 'success' : 'warning'}
                                  onClick={() => onAction(odl.id, action)}
                                  disabled={loading}
                                  size="small"
                                >
                                  {getActionIcon(action)}
                                </IconButton>
                              </Tooltip>
                            ))}
                          </Stack>
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, odl)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 2 }}>
                            <Typography variant="h6" gutterBottom component="div">
                              Dettagli ODL
                            </Typography>
                            <Stack spacing={2}>
                              {odl.currentDepartment && (
                                <Box>
                                  <Typography variant="subtitle2" color="text.secondary">
                                    Reparto Attuale
                                  </Typography>
                                  <Typography variant="body2">
                                    {odl.currentDepartment.name} ({odl.currentDepartment.code})
                                  </Typography>
                                </Box>
                              )}
                              {odl.lastEvent && (
                                <Box>
                                  <Typography variant="subtitle2" color="text.secondary">
                                    Ultimo Evento
                                  </Typography>
                                  <Typography variant="body2">
                                    {odl.lastEvent.eventType} - {new Date(odl.lastEvent.timestamp).toLocaleString()}
                                    {odl.lastEvent.user && ` da ${odl.lastEvent.user.name || odl.lastEvent.user.email}`}
                                  </Typography>
                                </Box>
                              )}
                              <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                  Tempo Totale di Produzione
                                </Typography>
                                <Typography variant="body2">
                                  {formatTime(odl.totalProductionTime)}
                                </Typography>
                              </Box>
                            </Stack>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={odls.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Righe per pagina"
      />

      {/* Menu contestuale */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedODL) {
            setQrModalODL(selectedODL)
          }
          handleMenuClose()
        }}>
          <ListItemIcon>
            <QrCode fontSize="small" />
          </ListItemIcon>
          <ListItemText>Mostra QR Code</ListItemText>
        </MenuItem>
        {isSupervisor && onAdvancedWorkflow && (
          <MenuItem onClick={() => {
            if (selectedODL) {
              onAdvancedWorkflow(selectedODL)
            }
            handleMenuClose()
          }}>
            <ListItemIcon>
              <AdminPanelSettings fontSize="small" />
            </ListItemIcon>
            <ListItemText>Gestione Avanzata</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* QR Display Modal */}
      {qrModalODL && (
        <QRDisplayModal
          open={Boolean(qrModalODL)}
          onClose={() => setQrModalODL(null)}
          odl={qrModalODL}
        />
      )}
    </Box>
  )
}