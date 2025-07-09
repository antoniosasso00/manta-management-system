'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Box
} from '@mui/material'
import { DataManagementTemplate } from '@/components/templates/DataManagementTemplate'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { FilterConfig, FilterValues } from '@/components/molecules/FilterPanel'
import { FormBuilder, FieldConfig } from '@/components/molecules/FormBuilder'
import { DetailDialog, DetailField } from '@/components/molecules/DetailDialog'
import { partRepository } from '@/services/api/repositories/part.repository'
import { createPartSchema, updatePartInputSchema } from '@/domains/core/schemas/part.schema'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { CreatePartInput, UpdatePartInput } from '@/domains/core/schemas/part.schema'
import type { Part } from '@/domains/core/schemas/part'
import type { Column } from '@/components/atoms/DataTable'

export default function PartsPage() {
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterValues, setFilterValues] = useState<FilterValues>({})
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedPart, setSelectedPart] = useState<Part | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewPart, setViewPart] = useState<Part | null>(null)

  // Form setup - separate create and update forms
  const createForm = useForm<CreatePartInput>({
    resolver: zodResolver(createPartSchema),
    defaultValues: {
      partNumber: '',
      description: ''
    }
  })

  const updateForm = useForm<UpdatePartInput>({
    resolver: zodResolver(updatePartInputSchema),
    defaultValues: {
      partNumber: '',
      description: ''
    }
  })

  // Use the appropriate form based on editing state
  const { control, handleSubmit, reset, formState: { errors } } = isEditing ? updateForm : createForm

  // Fetch parts con paginazione server-side
  const fetchParts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params: Record<string, string | number | boolean> = {
        page: page + 1, // API usa paginazione 1-based
        limit: rowsPerPage,
        sortBy,
        sortOrder
      }
      
      // Combina tutti i filtri di ricerca in un unico parametro search
      let searchTerms: string[] = []
      if (searchQuery) searchTerms.push(searchQuery)
      if (filterValues.partNumber && typeof filterValues.partNumber === 'string') {
        searchTerms.push(filterValues.partNumber)
      }
      if (filterValues.description && typeof filterValues.description === 'string') {
        searchTerms.push(filterValues.description)
      }
      
      if (searchTerms.length > 0) {
        params.search = searchTerms.join(' ')
      }
      
      console.log('API Call Parameters:', params)
      const response = await partRepository.getPaginated(params)
      setParts(response.parts)
      setTotalCount(response.total)
    } catch (error) {
      console.error('Error fetching parts:', error)
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        setError('Sessione scaduta. Effettua nuovamente il login.')
      } else if (error instanceof Error && error.message.includes('400')) {
        setError('Parametri non validi. Controlla i filtri di ricerca.')
      } else {
        setError(error instanceof Error ? error.message : 'Errore caricamento parti')
      }
    } finally {
      setLoading(false)
    }
  }, [searchQuery, filterValues, page, rowsPerPage, sortBy, sortOrder])

  useEffect(() => {
    fetchParts()
  }, [fetchParts])

  // Handlers
  const handleAdd = () => {
    setSelectedPart(null)
    setIsEditing(false)
    createForm.reset({})
    setFormOpen(true)
  }

  const handleEdit = (part: Part) => {
    setSelectedPart(part)
    setIsEditing(true)
    updateForm.reset({
      partNumber: part.partNumber,
      description: part.description
    })
    setFormOpen(true)
  }

  const handleView = (part: Part) => {
    setViewPart(part)
    setViewDialogOpen(true)
  }

  const handleDelete = async (part: Part) => {
    try {
      await partRepository.delete(part.id)
      await fetchParts()
    } catch (error) {
      console.error('Error deleting part:', error)
      setError(error instanceof Error ? error.message : 'Errore eliminazione parte')
    }
  }

  const handleFormSubmit = async (data: CreatePartInput | UpdatePartInput) => {
    try {
      if (isEditing && selectedPart) {
        await partRepository.update(selectedPart.id, data as UpdatePartInput)
      } else {
        await partRepository.create(data as CreatePartInput)
      }
      setFormOpen(false)
      reset()
      setPage(0) // Reset alla prima pagina dopo create/update
      await fetchParts()
    } catch (error) {
      console.error('Error saving part:', error)
      setError(error instanceof Error ? error.message : 'Errore salvataggio parte')
    }
  }

  const handleExport = async () => {
    try {
      // Per export, prendiamo tutti i dati senza paginazione
      const response = await partRepository.getPaginated({ limit: 10000 })
      const csv = convertToCSV(response.parts)
      downloadCSV(csv, 'parts-export.csv')
    } catch (error) {
      console.error('Error exporting parts:', error)
      setError(error instanceof Error ? error.message : 'Errore esportazione')
    }
  }

  // Table columns
  const columns: Column<Part>[] = [
    {
      id: 'partNumber',
      label: 'Numero Parte',
      minWidth: 150,
      format: (value) => <strong>{String(value)}</strong>
    },
    {
      id: 'description',
      label: 'Descrizione',
      minWidth: 200
    },
    {
      id: 'odlCount' as keyof Part,
      label: 'ODL',
      minWidth: 100,
      format: (_value, row) => String(row._count?.odls || 0)
    },
    {
      id: 'createdAt',
      label: 'Data Creazione',
      minWidth: 180,
      format: (value) => 
        value ? new Date(value as string).toLocaleString('it-IT') : ''
    }
  ]

  // Filter configuration
  const filters: FilterConfig[] = [
    {
      id: 'partNumber',
      label: 'Numero Parte',
      type: 'text',
      placeholder: 'Filtra per numero parte...'
    },
    {
      id: 'description',
      label: 'Descrizione',
      type: 'text',
      placeholder: 'Filtra per descrizione...'
    }
  ]

  // Form fields configuration
  const formFields: FieldConfig[] = [
    {
      name: 'partNumber',
      label: 'Numero Parte',
      type: 'text',
      required: true,
      placeholder: 'Es. 8G5350A0001',
      disabled: isEditing,
      gridSize: 6
    },
    {
      name: 'description',
      label: 'Descrizione',
      type: 'text',
      required: true,
      placeholder: 'Descrizione della parte',
      gridSize: 6
    }
  ]

  return (
    <PermissionGuard
      table="parts"
      action="canView"
      showError
    >
      <DataManagementTemplate
        // Data
        data={parts}
        columns={columns}
        loading={loading}
        error={error}
        totalCount={totalCount}
        
        // Page Config
        title="Gestione Parti"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Gestione Dati' },
          { label: 'Parti' }
        ]}
        
        // CRUD Actions
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        
        // Toolbar Actions
        onSearch={(query) => {
          setSearchQuery(query)
          setPage(0) // Reset alla prima pagina quando si cerca
        }}
        onExport={handleExport}
        onRefresh={() => {
          setPage(0)
          fetchParts()
        }}
        
        // Filter Config
        filters={filters}
        filterValues={filterValues}
        onFilterChange={setFilterValues}
        onFilterApply={() => {
          setPage(0) // Reset alla prima pagina quando si applicano filtri
          fetchParts()
        }}
        onFilterReset={() => {
          setFilterValues({})
          setPage(0)
          fetchParts()
        }}
        
        // Pagination Config
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={(newRowsPerPage) => {
          setRowsPerPage(newRowsPerPage)
          setPage(0) // Reset alla prima pagina quando si cambia rows per page
        }}
        enableServerPagination={true}
        
        // Sorting Config
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(newSortBy, newSortOrder) => {
          setSortBy(newSortBy)
          setSortOrder(newSortOrder)
          setPage(0) // Reset alla prima pagina quando si cambia ordinamento
        }}
        
        // Table Config
        searchPlaceholder="Cerca per numero parte o descrizione..."
        searchValue={searchQuery}
        addLabel="Nuova Parte"
        exportLabel="Esporta CSV"
        
        // Delete Confirmation
        deleteConfirmTitle={(part) => `Elimina parte ${part.partNumber}`}
        deleteConfirmMessage={(part) => 
          `Sei sicuro di voler eliminare la parte "${part.partNumber}"? Questa azione non può essere annullata.`
        }
        
        // Empty State
        emptyMessage="Nessuna parte trovata"
      />

      {/* Form Dialog */}
      <Dialog 
        open={formOpen} 
        onClose={() => setFormOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogTitle>
            {isEditing ? 'Modifica Parte' : 'Nuova Parte'}
          </DialogTitle>
          <DialogContent>
            <FormBuilder
              fields={formFields}
              control={control as any}
              errors={errors}
              columns={2}
              spacing={3}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFormOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" variant="contained">
              {isEditing ? 'Salva Modifiche' : 'Crea Parte'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Detail Dialog */}
      <DetailDialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false)
          setViewPart(null)
        }}
        title={viewPart?.partNumber || ''}
        subtitle="Dettagli Parte"
        sections={viewPart ? [
          {
            title: 'Informazioni Generali',
            fields: [
              {
                label: 'Numero Parte',
                value: viewPart.partNumber,
                size: { xs: 12, sm: 6 }
              },
              {
                label: 'Descrizione',
                value: viewPart.description || '-',
                size: { xs: 12, sm: 6 }
              },
              {
                label: 'Ordini di Lavoro',
                value: viewPart._count?.odls || 0,
                size: { xs: 12, sm: 6 }
              },
              {
                label: 'Ciclo di Cura Predefinito',
                value: viewPart.defaultCuringCycle ? (
                  <Chip label={viewPart.defaultCuringCycle} size="small" color="primary" />
                ) : '-',
                type: 'custom' as const,
                size: { xs: 12, sm: 6 }
              },
              {
                label: 'Linee Vacuum',
                value: viewPart.defaultVacuumLines || '-',
                size: { xs: 12, sm: 6 }
              }
            ]
          },
          {
            title: 'Date',
            fields: [
              {
                label: 'Data Creazione',
                value: viewPart.createdAt,
                type: 'date' as const,
                size: { xs: 12, sm: 6 }
              },
              {
                label: 'Ultima Modifica',
                value: viewPart.updatedAt,
                type: 'date' as const,
                size: { xs: 12, sm: 6 }
              }
            ]
          }
        ] : []}
        actions={
          <Button onClick={() => {
            setViewDialogOpen(false)
            setViewPart(null)
          }} variant="contained">
            Chiudi
          </Button>
        }
      />
    </PermissionGuard>
  )
}

// Utility functions
function convertToCSV(data: Part[]): string {
  const headers = ['Numero Parte', 'Descrizione', 'Lunghezza', 'Larghezza', 'Altezza', 'Linee Vuoto', 'Data Creazione']
  const rows = data.map(part => [
    part.partNumber,
    part.description,
    part.standardLength || '',
    part.standardWidth || '',
    part.standardHeight || '',
    part.defaultVacuumLines || '',
    new Date(part.createdAt).toLocaleDateString('it-IT')
  ])
  
  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}