'use client'

import { useState, useCallback } from 'react'
import { 
  Box, 
  Typography, 
  Chip, 
  IconButton, 
  Menu,
  MenuItem,
  Alert,
} from '@mui/material'
import { ConfirmActionDialog } from '@/components/atoms/ConfirmActionDialog'
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  MoreVert as MoreVertIcon,
  Add as AddIcon,
} from '@mui/icons-material'
import { DataTable, type Column } from '@/components/atoms/DataTable'
import { SearchInput } from '@/components/atoms/SearchInput'
import { Button } from '@/components/atoms/Button'
import { PartForm } from '@/components/molecules/PartForm'
import { usePermissions } from '@/hooks/usePermissions'
import type { CreatePartInput, UpdatePartInput, PartQueryInput } from '@/domains/core/schemas/part.schema'
import { format } from 'date-fns'
import type { Prisma } from '@prisma/client'

type Part = Prisma.PartGetPayload<{
  include: {
    defaultCuringCycle: {
      select: {
        id: true
        code: true
        name: true
      }
    }
    _count: {
      select: {
        odls: true
        partTools: true
      }
    }
  }
}>

interface PartsTableProps {
  data: Part[]
  loading: boolean
  totalCount: number
  query: PartQueryInput
  onQueryChange: (query: Partial<PartQueryInput>) => void
  onCreatePart: (data: CreatePartInput) => Promise<void>
  onUpdatePart: (id: string, data: UpdatePartInput) => Promise<void>
  onDeletePart: (id: string) => Promise<void>
  curingCycles?: Array<{ id: string; code: string; name: string }>
}

export function PartsTable({
  data,
  loading,
  totalCount,
  query,
  onQueryChange,
  onCreatePart,
  onUpdatePart,
  onDeletePart,
  curingCycles = [],
}: PartsTableProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [selectedPart, setSelectedPart] = useState<Part | null>(null)
  const [actionMenu, setActionMenu] = useState<{ anchorEl: HTMLElement; part: Part } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    part: Part | null;
  }>({ open: false, part: null })
  
  const permissions = usePermissions()

  const columns: Column<Part>[] = [
    {
      id: 'partNumber',
      label: 'Part Number',
      minWidth: 120,
      sortable: true,
    },
    {
      id: 'description',
      label: 'Description',
      minWidth: 200,
      sortable: true,
    },
    {
      id: 'defaultCuringCycle',
      label: 'Default Curing Cycle',
      minWidth: 150,
      format: (value: unknown) => {
        const curingCycle = value as Part['defaultCuringCycle']
        return curingCycle ? (
          <Chip 
            label={`${curingCycle.code} - ${curingCycle.name}`} 
            size="small" 
            variant="outlined" 
          />
        ) : (
          <Typography variant="body2" color="textSecondary">
            Not set
          </Typography>
        )
      },
    },
    {
      id: 'standardLength',
      label: 'Dimensions (L×W×H)',
      minWidth: 120,
      format: (value, row) => {
        const { standardLength, standardWidth, standardHeight } = row
        if (!standardLength || !standardWidth || !standardHeight) {
          return (
            <Typography variant="body2" color="textSecondary">
              Not specified
            </Typography>
          )
        }
        return `${standardLength}×${standardWidth}×${standardHeight} mm`
      },
    },
    {
      id: 'defaultVacuumLines',
      label: 'Vacuum Lines',
      minWidth: 100,
      align: 'center',
      format: (value: unknown) => (value as number) || '-',
    },
    {
      id: '_count',
      label: 'Usage',
      minWidth: 100,
      format: (count: unknown) => {
        const usage = count as Part['_count']
        return (
        <Box>
          <Typography variant="caption" display="block">
            {usage.odls} ODLs
          </Typography>
          <Typography variant="caption" display="block" color="textSecondary">
            {usage.partTools} tools
          </Typography>
        </Box>
        )
      },
    },
    {
      id: 'createdAt',
      label: 'Created',
      minWidth: 120,
      sortable: true,
      format: (value: unknown) => format(value as Date, 'dd/MM/yyyy'),
    },
    {
      id: 'id',
      label: 'Actions',
      minWidth: 80,
      align: 'center',
      format: (value, row) => (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            setActionMenu({ anchorEl: e.currentTarget, part: row })
          }}
        >
          <MoreVertIcon />
        </IconButton>
      ),
    },
  ]

  const handleSearch = useCallback((search: string) => {
    onQueryChange({ ...query, search, page: 1 })
  }, [query, onQueryChange])

  const handlePageChange = useCallback((page: number) => {
    onQueryChange({ ...query, page: page + 1 }) // MUI uses 0-based, our API uses 1-based
  }, [query, onQueryChange])

  const handleRowsPerPageChange = useCallback((limit: number) => {
    onQueryChange({ ...query, limit, page: 1 })
  }, [query, onQueryChange])

  const handleSortChange = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    onQueryChange({ ...query, sortBy: sortBy as 'createdAt' | 'partNumber' | 'description', sortOrder })
  }, [query, onQueryChange])

  const handleCreateClick = () => {
    setFormMode('create')
    setSelectedPart(null)
    setFormOpen(true)
    setError(null)
  }

  const handleEditClick = (part: Part) => {
    setFormMode('edit')
    setSelectedPart(part)
    setFormOpen(true)
    setError(null)
    setActionMenu(null)
  }

  const handleDeleteClick = async (part: Part) => {
    if (!permissions.parts.canDelete) {
      setError('You do not have permission to delete parts')
      return
    }

    setDeleteDialog({ open: true, part })
    setActionMenu(null)
  }

  const handleConfirmDelete = async () => {
    const part = deleteDialog.part
    if (!part) return

    try {
      setActionLoading(true)
      setError(null)
      await onDeletePart(part.id)
      setDeleteDialog({ open: false, part: null })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete part')
    } finally {
      setActionLoading(false)
    }
  }

  const handleFormSubmit = async (data: CreatePartInput | UpdatePartInput) => {
    try {
      setError(null)
      if (formMode === 'create') {
        await onCreatePart(data as CreatePartInput)
      } else if (selectedPart) {
        await onUpdatePart(selectedPart.id, data as UpdatePartInput)
      }
    } catch (error) {
      throw error // Let PartForm handle the error display
    }
  }

  const closeActionMenu = () => {
    setActionMenu(null)
  }

  const getFormInitialData = (): Partial<UpdatePartInput> | undefined => {
    if (!selectedPart) return undefined
    
    return {
      id: selectedPart.id,
      partNumber: selectedPart.partNumber,
      description: selectedPart.description,
      standardLength: selectedPart.standardLength || undefined,
      standardWidth: selectedPart.standardWidth || undefined,
      standardHeight: selectedPart.standardHeight || undefined,
      defaultVacuumLines: selectedPart.defaultVacuumLines || undefined,
      defaultCuringCycleId: selectedPart.defaultCuringCycle?.id,
    }
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Parts Management
        </Typography>
        {permissions.parts.canCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateClick}
          >
            Create Part
          </Button>
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search */}
      <Box mb={3}>
        <SearchInput
          value={query.search || ''}
          onChange={handleSearch}
          placeholder="Search by part number or description..."
        />
      </Box>

      {/* Table */}
      <DataTable<Part>
        columns={columns}
        data={data}
        loading={loading}
        totalCount={totalCount}
        page={(query.page || 1) - 1} // Convert to 0-based for MUI
        rowsPerPage={query.limit || 10}
        sortBy={query.sortBy}
        sortOrder={query.sortOrder}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onSortChange={handleSortChange}
        emptyMessage="No parts found"
      />

      {/* Part Form Dialog */}
      <PartForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={getFormInitialData()}
        mode={formMode}
        curingCycles={curingCycles}
        loading={actionLoading}
      />

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenu?.anchorEl}
        open={!!actionMenu}
        onClose={closeActionMenu}
      >
        {permissions.parts.canUpdate && (
          <MenuItem onClick={() => actionMenu && handleEditClick(actionMenu.part)}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
        )}
        {permissions.parts.canDelete && (
          <MenuItem 
            onClick={() => actionMenu && handleDeleteClick(actionMenu.part)}
            disabled={actionLoading}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        )}
      </Menu>

      {/* Confirm Delete Dialog */}
      <ConfirmActionDialog
        open={deleteDialog.open}
        title="Conferma Eliminazione"
        message={`Sei sicuro di voler eliminare il pezzo ${deleteDialog.part?.partNumber}? Questa azione non può essere annullata.`}
        confirmText="Elimina"
        cancelText="Annulla"
        severity="error"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialog({ open: false, part: null })}
      />
    </Box>
  )
}