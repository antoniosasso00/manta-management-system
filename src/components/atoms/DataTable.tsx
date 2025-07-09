'use client'

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TablePagination,
  Paper,
  TableSortLabel,
  Skeleton,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
  IconButton,
  Collapse,
  Card,
  CardContent,
  Stack,
  Chip
} from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import React, { useState } from 'react'

export interface Column<T> {
  id: keyof T
  label: string
  minWidth?: number
  align?: 'left' | 'right' | 'center'
  sortable?: boolean
  format?: (value: unknown, row: T) => React.ReactNode
  mobilePriority?: 'always' | 'expanded' | 'hidden' // Priorità visualizzazione mobile
  mobileLabel?: string // Label abbreviata per mobile
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  totalCount: number
  page: number
  rowsPerPage: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onPageChange: (page: number) => void
  onRowsPerPageChange: (rowsPerPage: number) => void
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  onRowClick?: (row: T) => void
  emptyMessage?: string
  stickyHeader?: boolean
  mobileView?: 'table' | 'cards' // Tipo di visualizzazione mobile
  mobileCardRenderer?: (row: T) => React.ReactNode // Renderer personalizzato per card mobile
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  totalCount,
  page,
  rowsPerPage,
  sortBy,
  sortOrder = 'asc',
  onPageChange,
  onRowsPerPageChange,
  onSortChange,
  onRowClick,
  emptyMessage = 'No data available',
  stickyHeader = true,
  mobileView = 'table',
  mobileCardRenderer,
}: DataTableProps<T>) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const handleSort = (columnId: string) => {
    if (!onSortChange) return
    
    const isCurrentColumn = sortBy === columnId
    const newOrder = isCurrentColumn && sortOrder === 'asc' ? 'desc' : 'asc'
    onSortChange(columnId, newOrder)
  }

  const toggleRowExpansion = (index: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedRows(newExpanded)
  }

  // Filtra colonne per vista mobile
  const visibleColumns = isMobile 
    ? columns.filter(col => col.mobilePriority === 'always' || col.mobilePriority === undefined)
    : columns
  
  const expandedColumns = columns.filter(col => col.mobilePriority === 'expanded')

  const handleChangePage = (event: unknown, newPage: number) => {
    onPageChange(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onRowsPerPageChange(parseInt(event.target.value, 10))
    onPageChange(0)
  }

  // Renderizza card per mobile view
  const renderMobileCard = (row: T, index: number) => {
    if (mobileCardRenderer) {
      return mobileCardRenderer(row)
    }

    const isExpanded = expandedRows.has(index)
    const alwaysVisibleColumns = columns.filter(col => col.mobilePriority === 'always' || !col.mobilePriority)
    const expandedOnlyColumns = columns.filter(col => col.mobilePriority === 'expanded')

    return (
      <Card 
        sx={{ 
          mb: 1, 
          cursor: onRowClick ? 'pointer' : 'default',
          '&:active': {
            backgroundColor: 'action.selected'
          }
        }}
      >
        <CardContent sx={{ pb: isExpanded ? 2 : 1, '&:last-child': { pb: isExpanded ? 2 : 1 } }}>
          <Stack spacing={1}>
            {alwaysVisibleColumns.map((column) => {
              const value = row[column.id]
              return (
                <Box key={String(column.id)} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ minWidth: '40%' }}>
                    {column.mobileLabel || column.label}:
                  </Typography>
                  <Box sx={{ textAlign: 'right', flexGrow: 1 }}>
                    {column.format ? column.format(value, row) : String(value ?? '')}
                  </Box>
                </Box>
              )
            })}
          </Stack>
          
          {expandedOnlyColumns.length > 0 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleRowExpansion(index)
                  }}
                >
                  {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                </IconButton>
              </Box>
              <Collapse in={isExpanded}>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {expandedOnlyColumns.map((column) => {
                    const value = row[column.id]
                    return (
                      <Box key={String(column.id)} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: '40%' }}>
                          {column.mobileLabel || column.label}:
                        </Typography>
                        <Box sx={{ textAlign: 'right', flexGrow: 1 }}>
                          {column.format ? column.format(value, row) : String(value ?? '')}
                        </Box>
                      </Box>
                    )
                  })}
                </Stack>
              </Collapse>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Paper sx={{ overflow: 'hidden' }}>
        {isMobile && mobileView === 'cards' ? (
          <Box sx={{ p: 2 }}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} sx={{ mb: 1 }}>
                <CardContent>
                  <Skeleton animation="wave" height={100} />
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
            <Table stickyHeader={stickyHeader} size={isMobile ? 'small' : 'medium'}>
              <TableHead>
                <TableRow>
                  {(isMobile && expandedColumns.length > 0) && (
                    <TableCell padding="checkbox" />
                  )}
                  {visibleColumns.map((column) => (
                    <TableCell
                      key={String(column.id)}
                      align={column.align}
                      sx={{ 
                        minWidth: isMobile ? 'auto' : column.minWidth,
                        whiteSpace: isMobile ? 'nowrap' : 'normal',
                        px: isMobile ? 1 : 2
                      }}
                    >
                      {isMobile && column.mobileLabel ? column.mobileLabel : column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.from({ length: rowsPerPage }).map((_, index) => (
                  <TableRow key={index}>
                    {(isMobile && expandedColumns.length > 0) && (
                      <TableCell padding="checkbox">
                        <Skeleton animation="wave" width={24} height={24} />
                      </TableCell>
                    )}
                    {visibleColumns.map((column) => (
                      <TableCell key={String(column.id)} sx={{ px: isMobile ? 1 : 2 }}>
                        <Skeleton animation="wave" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    )
  }

  if (data.length === 0) {
    return (
      <Paper>
        <Box p={4} textAlign="center">
          <Typography variant="body1" color="textSecondary">
            {emptyMessage}
          </Typography>
        </Box>
      </Paper>
    )
  }

  return (
    <Paper sx={{ overflow: 'hidden' }}>
      {isMobile && mobileView === 'cards' ? (
        // Vista mobile con cards
        <>
          <Box sx={{ p: 2 }}>
            {data.map((row, index) => (
              <Box 
                key={String(row.id) || index}
                onClick={() => onRowClick?.(row)}
              >
                {renderMobileCard(row, index)}
              </Box>
            ))}
          </Box>
          <TablePagination
            rowsPerPageOptions={isMobile ? [5, 10, 20] : [5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage={isMobile ? "Righe:" : "Righe per pagina:"}
            sx={{ 
              '.MuiTablePagination-toolbar': { 
                minHeight: isMobile ? 48 : 64,
                px: isMobile ? 1 : 2
              },
              '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                fontSize: isMobile ? '0.75rem' : '0.875rem'
              }
            }}
          />
        </>
      ) : (
        // Vista tabella (responsive)
        <>
          <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
            <Table stickyHeader={stickyHeader} size={isMobile ? 'small' : 'medium'}>
              <TableHead>
                <TableRow>
                  {isMobile && expandedColumns.length > 0 && (
                    <TableCell padding="checkbox" sx={{ width: 48 }} />
                  )}
                  {visibleColumns.map((column) => (
                    <TableCell
                      key={String(column.id)}
                      align={column.align}
                      sx={{ 
                        minWidth: isMobile ? 'auto' : column.minWidth,
                        whiteSpace: isMobile ? 'nowrap' : 'normal',
                        px: isMobile ? 1 : 2,
                        py: isMobile ? 1 : 1.5
                      }}
                    >
                      {column.sortable && onSortChange ? (
                        <TableSortLabel
                          active={sortBy === column.id}
                          direction={sortBy === column.id ? sortOrder : 'asc'}
                          onClick={() => handleSort(String(column.id))}
                        >
                          {isMobile && column.mobileLabel ? column.mobileLabel : column.label}
                        </TableSortLabel>
                      ) : (
                        isMobile && column.mobileLabel ? column.mobileLabel : column.label
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, index) => {
                  const isExpanded = expandedRows.has(index)
                  const rowKey = String(row.id) || String(index)
                  return (
                    <React.Fragment key={rowKey}>
                      <TableRow
                        hover={!!onRowClick}
                        onClick={() => onRowClick?.(row)}
                        sx={{ 
                          cursor: onRowClick ? 'pointer' : 'default',
                          '& > *': { borderBottom: isExpanded ? 'none' : undefined }
                        }}
                      >
                        {isMobile && expandedColumns.length > 0 && (
                          <TableCell padding="checkbox">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleRowExpansion(index)
                              }}
                            >
                              {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                            </IconButton>
                          </TableCell>
                        )}
                        {visibleColumns.map((column) => {
                          const value = row[column.id]
                          return (
                            <TableCell 
                              key={String(column.id)} 
                              align={column.align}
                              sx={{ 
                                px: isMobile ? 1 : 2,
                                py: isMobile ? 1 : 1.5,
                                fontSize: isMobile ? '0.813rem' : '0.875rem'
                              }}
                            >
                              {column.format ? column.format(value, row) : String(value ?? '')}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                      {isMobile && expandedColumns.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={visibleColumns.length + 1} sx={{ py: 0 }}>
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                                <Stack spacing={1}>
                                  {expandedColumns.map((column) => {
                                    const value = row[column.id]
                                    return (
                                      <Box key={String(column.id)} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="caption" color="text.secondary">
                                          {column.label}:
                                        </Typography>
                                        <Box>
                                          {column.format ? column.format(value, row) : String(value ?? '')}
                                        </Box>
                                      </Box>
                                    )
                                  })}
                                </Stack>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={isMobile ? [5, 10, 20] : [5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage={isMobile ? "Righe:" : "Righe per pagina:"}
            sx={{ 
              '.MuiTablePagination-toolbar': { 
                minHeight: isMobile ? 48 : 64,
                px: isMobile ? 1 : 2
              },
              '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                fontSize: isMobile ? '0.75rem' : '0.875rem'
              }
            }}
          />
        </>
      )}
    </Paper>
  )
}