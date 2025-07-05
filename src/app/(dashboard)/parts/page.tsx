'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip
} from '@mui/material'
import { DataManagementTemplate } from '@/components/templates/DataManagementTemplate'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { FilterConfig, FilterValues } from '@/components/molecules/FilterPanel'
import { FormBuilder, FieldConfig } from '@/components/molecules/FormBuilder'
import { partRepository } from '@/services/api/repositories/part.repository'
import { createPartSchema, updatePartSchema } from '@/domains/core/schemas/part.schema'
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
  const [selectedPart, setSelectedPart] = useState<Part | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Form setup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CreatePartInput | UpdatePartInput>({
    resolver: zodResolver(isEditing ? updatePartSchema : createPartSchema)
  })

  // Fetch parts
  const fetchParts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params: Record<string, string | number | boolean> = {}
      if (searchQuery) params.search = searchQuery
      if (filterValues.partNumber && typeof filterValues.partNumber === 'string') {
        params.partNumber = filterValues.partNumber
      }
      if (filterValues.description && typeof filterValues.description === 'string') {
        params.description = filterValues.description
      }
      
      const data = await partRepository.getAll(params)
      setParts(data)
    } catch (error) {
      console.error('Error fetching parts:', error)
      setError(error instanceof Error ? error.message : 'Errore caricamento parti')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, filterValues])

  useEffect(() => {
    fetchParts()
  }, [fetchParts])

  // Handlers
  const handleAdd = () => {
    setSelectedPart(null)
    setIsEditing(false)
    reset({})
    setFormOpen(true)
  }

  const handleEdit = (part: Part) => {
    setSelectedPart(part)
    setIsEditing(true)
    reset({
      partNumber: part.partNumber,
      description: part.description,
      defaultCuringCycleId: part.defaultCuringCycle ?? undefined,
      standardLength: part.standardLength ?? undefined,
      standardWidth: part.standardWidth ?? undefined,
      standardHeight: part.standardHeight ?? undefined
    })
    setFormOpen(true)
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
      await fetchParts()
    } catch (error) {
      console.error('Error saving part:', error)
      setError(error instanceof Error ? error.message : 'Errore salvataggio parte')
    }
  }

  const handleExport = async () => {
    try {
      const data = await partRepository.getAll()
      const csv = convertToCSV(data)
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
      id: 'updatedAt',
      label: 'Ultima Modifica',
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
        
        // Toolbar Actions
        onSearch={setSearchQuery}
        onExport={handleExport}
        onRefresh={fetchParts}
        
        // Filter Config
        filters={filters}
        filterValues={filterValues}
        onFilterChange={setFilterValues}
        onFilterApply={fetchParts}
        onFilterReset={() => {
          setFilterValues({})
          fetchParts()
        }}
        
        // Table Config
        searchPlaceholder="Cerca per numero parte o descrizione..."
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
              control={control}
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