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
  Alert,
  Card,
  CardContent,
  Avatar,
  LinearProgress,
  Fade,
  Zoom,
  Slide
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
      case 'ASSIGNED':
        // ODL assegnato ma non ancora entrato
        return ['ENTRY']
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

  // Mobile view - enhanced cards with industrial standards
  if (isMobile) {
    return (
      <Box sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {paginatedODLs.map((odl, index) => {
            const availableActions = getAvailableActions(odl)
            const isCompleted = availableActions.length === 0
            
            return (
              <Card
                key={odl.id}
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  },
                  ...(isCompleted && {
                    bgcolor: 'rgba(46, 125, 50, 0.04)',
                    borderLeft: '4px solid #37474f'
                  })
                }}
              >
                  {/* Priority indicator band */}
                  <Box
                    sx={{
                      height: 3,
                      width: '100%',
                      bgcolor: 
                        odl.priority === 'URGENT' ? '#d32f2f' :
                        odl.priority === 'HIGH' ? '#f57c00' :
                        odl.priority === 'NORMAL' ? '#37474f' :
                        '#546e7a'
                    }}
                  />
                  
                  <CardContent sx={{ p: 3 }}>
                    {/* Header with ODL number and status */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar 
                          sx={{ 
                            width: 48, 
                            height: 48, 
                            bgcolor: 'primary.main',
                            fontSize: '1rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {odl.odlNumber.slice(-2)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight={700} color="primary.main">
                            {odl.odlNumber}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Qtà: {odl.quantity}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Chip
                        label={odl.status.replace('_', ' ')}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          minHeight: 32, // Touch-friendly
                          ...(odl.status.includes('COMPLETED') && {
                            bgcolor: 'rgba(46, 125, 50, 0.1)',
                            color: '#2e7d32',
                            border: '1px solid rgba(46, 125, 50, 0.3)'
                          }),
                          ...(odl.status.includes('IN_') && {
                            bgcolor: 'rgba(25, 118, 210, 0.1)',
                            color: '#1976d2',
                            border: '1px solid rgba(25, 118, 210, 0.3)'
                          })
                        }}
                      />
                    </Box>

                    {/* Part information */}
                    <Box mb={2}>
                      <Typography variant="body1" fontWeight={600} mb={0.5}>
                        {odl.part.partNumber}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {odl.part.description}
                      </Typography>
                    </Box>

                    {/* Metrics row */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Timer fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {formatTime(odl.timeInCurrentDepartment || 0)}
                        </Typography>
                      </Box>
                      
                      <Chip
                        label={odl.priority}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          minHeight: 32, // Touch-friendly
                          ...(odl.priority === 'URGENT' && {
                            bgcolor: 'rgba(244, 67, 54, 0.1)',
                            color: '#d32f2f',
                            border: '1px solid rgba(244, 67, 54, 0.3)'
                          }),
                          ...(odl.priority === 'HIGH' && {
                            bgcolor: 'rgba(255, 152, 0, 0.1)',
                            color: '#f57c00',
                            border: '1px solid rgba(255, 152, 0, 0.3)'
                          }),
                          ...(odl.priority === 'NORMAL' && {
                            bgcolor: 'rgba(63, 81, 181, 0.1)',
                            color: '#3f51b5',
                            border: '1px solid rgba(63, 81, 181, 0.3)'
                          }),
                          ...(odl.priority === 'LOW' && {
                            bgcolor: 'rgba(76, 175, 80, 0.1)',
                            color: '#388e3c',
                            border: '1px solid rgba(76, 175, 80, 0.3)'
                          })
                        }}
                      />
                    </Box>

                    {/* Action buttons - optimized for industrial touch */}
                    {isCompleted ? (
                      <Box display="flex" justifyContent="center">
                        <Chip 
                          label="Completato" 
                          sx={{
                            bgcolor: 'rgba(46, 125, 50, 0.1)',
                            color: '#2e7d32',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            height: 36,
                            border: '1px solid rgba(46, 125, 50, 0.3)'
                          }}
                        />
                      </Box>
                    ) : (
                      <Box display="flex" gap={1} justifyContent="center" flexWrap="wrap">
                        {availableActions.map((action) => (
                          <Tooltip key={action} title={action} arrow>
                            <IconButton
                              onClick={() => onAction(odl.id, action)}
                              disabled={loading}
                              sx={{
                                width: 60, // Industrial standard minimum
                                height: 60, // Industrial standard minimum
                                borderRadius: 3,
                                transition: 'all 0.2s ease-in-out',
                                border: '2px solid',
                                ...(action === 'ENTRY' && {
                                  bgcolor: 'rgba(76, 175, 80, 0.1)',
                                  borderColor: 'rgba(76, 175, 80, 0.3)',
                                  color: '#388e3c',
                                  '&:hover': { 
                                    bgcolor: 'rgba(76, 175, 80, 0.2)',
                                    transform: 'scale(1.05)'
                                  }
                                }),
                                ...(action === 'EXIT' && {
                                  bgcolor: 'rgba(244, 67, 54, 0.1)',
                                  borderColor: 'rgba(244, 67, 54, 0.3)',
                                  color: '#d32f2f',
                                  '&:hover': { 
                                    bgcolor: 'rgba(244, 67, 54, 0.2)',
                                    transform: 'scale(1.05)'
                                  }
                                }),
                                ...(action === 'PAUSE' && {
                                  bgcolor: 'rgba(255, 152, 0, 0.1)',
                                  borderColor: 'rgba(255, 152, 0, 0.3)',
                                  color: '#f57c00',
                                  '&:hover': { 
                                    bgcolor: 'rgba(255, 152, 0, 0.2)',
                                    transform: 'scale(1.05)'
                                  }
                                }),
                                ...(action === 'RESUME' && {
                                  bgcolor: 'rgba(63, 81, 181, 0.1)',
                                  borderColor: 'rgba(63, 81, 181, 0.3)',
                                  color: '#3f51b5',
                                  '&:hover': { 
                                    bgcolor: 'rgba(63, 81, 181, 0.2)',
                                    transform: 'scale(1.05)'
                                  }
                                })
                              }}
                            >
                              {getActionIcon(action)}
                            </IconButton>
                          </Tooltip>
                        ))}
                        
                        {/* More options button */}
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, odl)}
                          sx={{
                            width: 60,
                            height: 60,
                            borderRadius: 3,
                            bgcolor: 'rgba(158, 158, 158, 0.1)',
                            borderColor: 'rgba(158, 158, 158, 0.3)',
                            border: '2px solid',
                            color: '#616161',
                            '&:hover': { 
                              bgcolor: 'rgba(158, 158, 158, 0.2)',
                              transform: 'scale(1.05)'
                            }
                          }}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>
                    )}
                  </CardContent>
                </Card>
            )
          })}
        </Box>
        
        <Box mt={4}>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={odls.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="ODL per pagina"
            sx={{
              '& .MuiTablePagination-actions button': {
                minWidth: 48, // Touch-friendly pagination
                minHeight: 48
              }
            }}
          />
        </Box>
      </Box>
    )
  }

  // Desktop view - use table
  return (
    <Box>
      <Card elevation={0} sx={{ 
        borderRadius: 3, 
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.8) 100%)'
      }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} size="medium">
          <TableHead>
            <TableRow sx={{ 
              background: 'linear-gradient(135deg, #37474f 0%, #546e7a 100%)',
              '& .MuiTableCell-head': {
                color: 'white',
                fontWeight: 600,
                fontSize: '0.875rem',
                borderBottom: 'none',
                py: 2.5
              }
            }}>
              <TableCell width={40} />
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'odlNumber'}
                  direction={orderBy === 'odlNumber' ? order : 'asc'}
                  onClick={() => handleRequestSort('odlNumber')}
                  sx={{ 
                    color: 'inherit !important',
                    '& .MuiTableSortLabel-icon': { color: 'inherit !important' }
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    Numero ODL
                  </Box>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'partNumber'}
                  direction={orderBy === 'partNumber' ? order : 'asc'}
                  onClick={() => handleRequestSort('partNumber')}
                  sx={{ 
                    color: 'inherit !important',
                    '& .MuiTableSortLabel-icon': { color: 'inherit !important' }
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    Part Number
                  </Box>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  Quantità
                </Box>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'priority'}
                  direction={orderBy === 'priority' ? order : 'asc'}
                  onClick={() => handleRequestSort('priority')}
                  sx={{ 
                    color: 'inherit !important',
                    '& .MuiTableSortLabel-icon': { color: 'inherit !important' }
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    Priorità
                  </Box>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'status'}
                  direction={orderBy === 'status' ? order : 'asc'}
                  onClick={() => handleRequestSort('status')}
                  sx={{ 
                    color: 'inherit !important',
                    '& .MuiTableSortLabel-icon': { color: 'inherit !important' }
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    Stato
                  </Box>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'timeInDepartment'}
                  direction={orderBy === 'timeInDepartment' ? order : 'asc'}
                  onClick={() => handleRequestSort('timeInDepartment')}
                  sx={{ 
                    color: 'inherit !important',
                    '& .MuiTableSortLabel-icon': { color: 'inherit !important' }
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    Tempo nel Reparto
                  </Box>
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <Box display="flex" alignItems="center" gap={1} justifyContent="center">
                  Azioni
                </Box>
              </TableCell>
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
                          bgcolor: isCompleted 
                            ? 'rgba(46, 125, 50, 0.08)' // Verde molto tenue per completati
                            : 'transparent',
                          borderLeft: isCompleted 
                            ? '3px solid #2e7d32' // Barra verde a sinistra per completati
                            : '3px solid transparent',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            bgcolor: isCompleted 
                              ? 'rgba(46, 125, 50, 0.12)' 
                              : 'rgba(63, 81, 181, 0.04)',
                            transform: 'translateX(4px)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                            borderLeft: isCompleted 
                              ? '3px solid #2e7d32'
                              : '3px solid #3f51b5'
                          },
                          '& .MuiTableCell-root': {
                            borderBottom: '1px solid rgba(224, 224, 224, 0.2)',
                            py: 2.5
                          }
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
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar 
                            sx={{ 
                              width: 32, 
                              height: 32, 
                              bgcolor: 'primary.main',
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}
                          >
                            {odl.odlNumber.slice(-2)}
                          </Avatar>
                          <Typography variant="body2" fontWeight={600} color="primary.main">
                            {odl.odlNumber}
                          </Typography>
                        </Box>
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
                        <Chip
                          label={odl.priority}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            ...(odl.priority === 'URGENT' && {
                              bgcolor: 'rgba(244, 67, 54, 0.1)',
                              color: '#d32f2f',
                              border: '1px solid rgba(244, 67, 54, 0.3)'
                            }),
                            ...(odl.priority === 'HIGH' && {
                              bgcolor: 'rgba(255, 152, 0, 0.1)',
                              color: '#f57c00',
                              border: '1px solid rgba(255, 152, 0, 0.3)'
                            }),
                            ...(odl.priority === 'NORMAL' && {
                              bgcolor: 'rgba(63, 81, 181, 0.1)',
                              color: '#3f51b5',
                              border: '1px solid rgba(63, 81, 181, 0.3)'
                            }),
                            ...(odl.priority === 'LOW' && {
                              bgcolor: 'rgba(76, 175, 80, 0.1)',
                              color: '#388e3c',
                              border: '1px solid rgba(76, 175, 80, 0.3)'
                            })
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={odl.status.replace('_', ' ')}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            ...(odl.status.includes('COMPLETED') && {
                              bgcolor: 'rgba(46, 125, 50, 0.1)',
                              color: '#2e7d32',
                              border: '1px solid rgba(46, 125, 50, 0.3)'
                            }),
                            ...(odl.status.includes('IN_') && {
                              bgcolor: 'rgba(25, 118, 210, 0.1)',
                              color: '#1976d2',
                              border: '1px solid rgba(25, 118, 210, 0.3)'
                            }),
                            ...(odl.status === 'CREATED' && {
                              bgcolor: 'rgba(158, 158, 158, 0.1)',
                              color: '#616161',
                              border: '1px solid rgba(158, 158, 158, 0.3)'
                            })
                          }}
                        />
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
                            size="small"
                            sx={{
                              bgcolor: 'rgba(46, 125, 50, 0.1)',
                              color: '#2e7d32',
                              fontWeight: 600,
                              border: '1px solid rgba(46, 125, 50, 0.3)'
                            }}
                          />
                        ) : (
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            {availableActions.map((action) => (
                              <Tooltip key={action} title={action} arrow>
                                <IconButton
                                  onClick={() => onAction(odl.id, action)}
                                  disabled={loading}
                                  size="small"
                                  sx={{
                                    borderRadius: '8px',
                                    transition: 'all 0.2s ease-in-out',
                                    ...(action === 'ENTRY' && {
                                      bgcolor: 'rgba(76, 175, 80, 0.1)',
                                      color: '#388e3c',
                                      '&:hover': { 
                                        bgcolor: 'rgba(76, 175, 80, 0.2)',
                                        transform: 'scale(1.1)'
                                      }
                                    }),
                                    ...(action === 'EXIT' && {
                                      bgcolor: 'rgba(244, 67, 54, 0.1)',
                                      color: '#d32f2f',
                                      '&:hover': { 
                                        bgcolor: 'rgba(244, 67, 54, 0.2)',
                                        transform: 'scale(1.1)'
                                      }
                                    }),
                                    ...(action === 'PAUSE' && {
                                      bgcolor: 'rgba(255, 152, 0, 0.1)',
                                      color: '#f57c00',
                                      '&:hover': { 
                                        bgcolor: 'rgba(255, 152, 0, 0.2)',
                                        transform: 'scale(1.1)'
                                      }
                                    }),
                                    ...(action === 'RESUME' && {
                                      bgcolor: 'rgba(63, 81, 181, 0.1)',
                                      color: '#3f51b5',
                                      '&:hover': { 
                                        bgcolor: 'rgba(63, 81, 181, 0.2)',
                                        transform: 'scale(1.1)'
                                      }
                                    })
                                  }}
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
      </Card>
      
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