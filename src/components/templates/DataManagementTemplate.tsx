'use client'

import React, { useState, useCallback } from 'react'
import { 
  Box, 
  Paper, 
  Typography, 
  Breadcrumbs, 
  Link,
  CircularProgress,
  Alert,
  Button
} from '@mui/material'
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material'
import { CRUDToolbar } from '@/components/molecules/CRUDToolbar'
import { FilterPanel, FilterConfig, FilterValues } from '@/components/molecules/FilterPanel'
import { DataTable, Column } from '@/components/atoms/DataTable'
import { ConfirmActionDialog } from '@/components/atoms/ConfirmActionDialog'
import { TableActions, TableAction } from '@/components/molecules/TableActions'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface DataManagementTemplateProps<T extends Record<string, unknown>> {
  // Data
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  error?: string | null
  totalCount?: number  // Totale elementi server-side
  
  // Page Config
  title: string
  breadcrumbs?: BreadcrumbItem[]
  
  // CRUD Actions
  onAdd?: () => void
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  onView?: (item: T) => void
  
  // Toolbar Actions
  onSearch?: (query: string) => void
  onExport?: () => void
  onRefresh?: () => void
  
  // Filter Config
  filters?: FilterConfig[]
  filterValues?: FilterValues
  onFilterChange?: (values: FilterValues) => void
  onFilterApply?: () => void
  onFilterReset?: () => void
  
  // Table Config
  searchPlaceholder?: string
  searchValue?: string
  addLabel?: string
  exportLabel?: string
  showAdd?: boolean
  showSearch?: boolean
  showExport?: boolean
  showFilter?: boolean
  showRefresh?: boolean
  
  // Pagination Config
  page?: number
  rowsPerPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
  enableServerPagination?: boolean
  
  // Sorting Config
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  
  // Delete Confirmation
  deleteConfirmTitle?: (item: T) => string
  deleteConfirmMessage?: (item: T) => string
  
  // Custom Actions
  customActions?: TableAction<T>[]
  actionsVariant?: 'inline' | 'menu' | 'auto'
  
  // Empty State
  emptyMessage?: string
  emptyIcon?: React.ReactNode
}

export function DataManagementTemplate<T extends { id: string | number }>({
  // Data
  data,
  columns,
  loading = false,
  error = null,
  totalCount,
  
  // Page Config
  title,
  breadcrumbs = [],
  
  // CRUD Actions
  onAdd,
  onEdit,
  onDelete,
  onView,
  
  // Toolbar Actions
  onSearch,
  onExport,
  onRefresh,
  
  // Filter Config
  filters = [],
  filterValues = {},
  onFilterChange,
  onFilterApply,
  onFilterReset,
  
  // Table Config
  searchPlaceholder,
  searchValue,
  addLabel,
  exportLabel,
  showAdd = true,
  showSearch = true,
  showExport = true,
  showFilter = true,
  showRefresh = true,
  
  // Pagination Config
  page: propPage,
  rowsPerPage: propRowsPerPage,
  onPageChange: propOnPageChange,
  onRowsPerPageChange: propOnRowsPerPageChange,
  enableServerPagination = false,
  
  // Sorting Config
  sortBy,
  sortOrder,
  onSortChange,
  
  // Delete Confirmation
  deleteConfirmTitle = () => 'Conferma eliminazione',
  deleteConfirmMessage = () => 'Sei sicuro di voler eliminare questo elemento?',
  
  // Custom Actions
  customActions,
  actionsVariant = 'auto',
  
  // Empty State
  emptyMessage = 'Nessun dato disponibile',
  emptyIcon
}: DataManagementTemplateProps<T>) {
  const [filterOpen, setFilterOpen] = useState(false)
  const [deleteItem, setDeleteItem] = useState<T | null>(null)
  
  // Usa paginazione server-side se abilitata, altrimenti client-side
  const [localPage, setLocalPage] = useState(0)
  const [localRowsPerPage, setLocalRowsPerPage] = useState(10)
  
  const currentPage = enableServerPagination ? (propPage ?? 0) : localPage
  const currentRowsPerPage = enableServerPagination ? (propRowsPerPage ?? 10) : localRowsPerPage
  const currentTotalCount = enableServerPagination ? (totalCount ?? (data?.length ?? 0)) : (data?.length ?? 0)
  
  const handleFilterOpen = useCallback(() => {
    setFilterOpen(true)
  }, [])
  
  const handleFilterClose = useCallback(() => {
    setFilterOpen(false)
  }, [])
  
  const handleDeleteClick = useCallback((item: T) => {
    setDeleteItem(item)
  }, [])
  
  const handleDeleteConfirm = useCallback(() => {
    if (deleteItem && onDelete) {
      onDelete(deleteItem)
    }
    setDeleteItem(null)
  }, [deleteItem, onDelete])
  
  const handleDeleteCancel = useCallback(() => {
    setDeleteItem(null)
  }, [])
  
  // Add action buttons to columns if needed
  const enhancedColumns = React.useMemo(() => {
    const hasActions = onEdit || onDelete || onView || customActions
    if (!hasActions) return columns
    
    return [
      ...columns,
      {
        id: 'actions' as keyof T,
        label: 'Azioni',
        sortable: false,
        format: (_value: unknown, row: T) => {
          return (
            <TableActions
              item={row}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete ? () => handleDeleteClick(row) : undefined}
              actions={customActions}
              variant={actionsVariant}
              size="small"
            />
          )
        }
      }
    ]
  }, [columns, onEdit, onDelete, onView, customActions, handleDeleteClick, actionsVariant])
  
  return (
    <Box>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ mb: 2 }}
        >
          {breadcrumbs.map((crumb, index) => (
            <Link
              key={index}
              underline="hover"
              color={index === breadcrumbs.length - 1 ? 'text.primary' : 'inherit'}
              href={crumb.href}
              sx={{ cursor: crumb.href ? 'pointer' : 'default' }}
            >
              {crumb.label}
            </Link>
          ))}
        </Breadcrumbs>
      )}
      
      {/* Title */}
      <Typography variant="h4" component="h1" gutterBottom>
        {title}
      </Typography>
      
      {/* Main Content */}
      <Paper sx={{ p: 3, mt: 3 }}>
        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* CRUD Toolbar */}
        <CRUDToolbar
          onAdd={showAdd ? onAdd : undefined}
          onSearch={showSearch ? onSearch : undefined}
          onExport={showExport ? onExport : undefined}
          onFilter={showFilter && filters && filters.length > 0 ? handleFilterOpen : undefined}
          onRefresh={showRefresh ? onRefresh : undefined}
          searchPlaceholder={searchPlaceholder}
          searchValue={searchValue}
          addLabel={addLabel}
          exportLabel={exportLabel}
          disabled={loading}
        />
        
        {/* Loading State */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          /* Data Table */
          <DataTable
            data={data ?? []}
            columns={enhancedColumns}
            totalCount={currentTotalCount}
            page={currentPage}
            rowsPerPage={currentRowsPerPage}
            onPageChange={enableServerPagination ? propOnPageChange ?? (() => {}) : setLocalPage}
            onRowsPerPageChange={enableServerPagination ? propOnRowsPerPageChange ?? (() => {}) : setLocalRowsPerPage}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={onSortChange}
            stickyHeader
          />
        )}
        
        {/* Empty State */}
        {!loading && (data?.length ?? 0) === 0 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
              color: 'text.secondary'
            }}
          >
            {emptyIcon}
            <Typography variant="h6" sx={{ mt: 2 }}>
              {emptyMessage}
            </Typography>
          </Box>
        )}
      </Paper>
      
      {/* Filter Panel */}
      {filters && filters.length > 0 && (
        <FilterPanel
          open={filterOpen}
          onClose={handleFilterClose}
          filters={filters}
          values={filterValues}
          onChange={onFilterChange || (() => {})}
          onApply={onFilterApply || (() => {})}
          onReset={onFilterReset || (() => {})}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      {deleteItem && (
        <ConfirmActionDialog
          open={!!deleteItem}
          onCancel={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title={deleteConfirmTitle(deleteItem)}
          message={deleteConfirmMessage(deleteItem)}
          confirmText="Elimina"
          cancelText="Annulla"
          severity="error"
        />
      )}
    </Box>
  )
}