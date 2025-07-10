'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material'
import { DataManagementTemplate } from '@/components/templates/DataManagementTemplate'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { FilterConfig, FilterValues } from '@/components/molecules/FilterPanel'
import { FormBuilder, FieldConfig } from '@/components/molecules/FormBuilder'
import { DetailDialog, DetailField } from '@/components/molecules/DetailDialog'
import { partRepository } from '@/services/api/repositories/part.repository'
import { createPartSchema, updatePartInputSchema } from '@/domains/core/schemas/part'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { CreatePartInput, UpdatePartInputData } from '@/domains/core/schemas/part'
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
  const [curingCycles, setCuringCycles] = useState<{value: string, label: string}[]>([])

  // Form setup - separate create and update forms
  const createForm = useForm<CreatePartInput>({
    resolver: zodResolver(createPartSchema),
    defaultValues: {
      partNumber: '',
      description: '',
      curingCycleId: '',
      vacuumLines: undefined,
      autoclaveSetupTime: undefined,
      autoclaveLoadPosition: '',
      resinType: '',
      prepregCode: '',
      cycleTime: undefined,
      roomTemperature: undefined,
      inspectionTime: undefined,
      calibrationReq: ''
    }
  })

  const updateForm = useForm<UpdatePartInputData>({
    resolver: zodResolver(updatePartInputSchema),
    defaultValues: {
      partNumber: '',
      description: '',
      curingCycleId: '',
      vacuumLines: undefined,
      autoclaveSetupTime: undefined,
      autoclaveLoadPosition: '',
      resinType: '',
      prepregCode: '',
      cycleTime: undefined,
      roomTemperature: undefined,
      inspectionTime: undefined,
      calibrationReq: ''
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

  // Fetch curing cycles for dropdown
  const fetchCuringCycles = useCallback(async () => {
    try {
      const response = await fetch('/api/curing-cycles?limit=100&isActive=true')
      if (response.ok) {
        const data = await response.json()
        const cycleOptions = data.cycles.map((cycle: any) => ({
          value: cycle.id,
          label: `${cycle.code} - ${cycle.name}`
        }))
        setCuringCycles(cycleOptions)
      }
    } catch (error) {
      console.error('Error fetching curing cycles:', error)
    }
  }, [])

  useEffect(() => {
    fetchParts()
    fetchCuringCycles()
  }, [fetchParts, fetchCuringCycles])

  // Handlers
  const handleAdd = () => {
    setSelectedPart(null)
    setIsEditing(false)
    createForm.reset({
      partNumber: '',
      description: '',
      curingCycleId: '',
      vacuumLines: undefined,
      autoclaveSetupTime: undefined,
      autoclaveLoadPosition: '',
      resinType: '',
      prepregCode: '',
      cycleTime: undefined,
      roomTemperature: undefined,
      inspectionTime: undefined,
      calibrationReq: ''
    })
    setFormOpen(true)
  }

  const handleEdit = (part: Part) => {
    if (!part) {
      setError('Parte non valida selezionata')
      return
    }
    
    setSelectedPart(part)
    setIsEditing(true)
    updateForm.reset({
      partNumber: part.partNumber || '',
      description: part.description || '',
      curingCycleId: part.autoclaveConfig?.curingCycleId || '',
      vacuumLines: part.autoclaveConfig?.vacuumLines || undefined,
      autoclaveSetupTime: part.autoclaveConfig?.setupTime || undefined,
      autoclaveLoadPosition: part.autoclaveConfig?.loadPosition || '',
      resinType: part.cleanroomConfig?.resinType || '',
      prepregCode: part.cleanroomConfig?.prepregCode || '',
      cycleTime: part.cleanroomConfig?.cycleTime || undefined,
      roomTemperature: part.cleanroomConfig?.roomTemperature || undefined,
      inspectionTime: part.ndiConfig?.inspectionTime || undefined,
      calibrationReq: part.ndiConfig?.calibrationReq || ''
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

  const handleFormSubmit = async (data: CreatePartInput | UpdatePartInputData) => {
    if (!data) {
      setError('Dati del form non validi')
      return
    }
    
    try {
      if (isEditing && selectedPart?.id) {
        // For update, add id to data for validation
        const updateData = { ...data, id: selectedPart.id }
        await partRepository.update(selectedPart.id, updateData)
      } else {
        // For create, cast data to CreatePartInput
        await partRepository.create(data as CreatePartInput)
      }
      setFormOpen(false)
      reset()
      setPage(0) // Reset alla prima pagina dopo create/update
      await fetchParts()
    } catch (error) {
      console.error('Error saving part:', error)
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          setError('Numero parte già esistente. Scegli un numero diverso.')
        } else if (error.message.includes('validation') || error.message.includes('invalid')) {
          setError('Dati non validi. Controlla i campi del form.')
        } else {
          setError(error.message)
        }
      } else {
        setError('Errore salvataggio parte')
      }
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
      format: (value) => <strong>{String(value || '')}</strong>
    },
    {
      id: 'description',
      label: 'Descrizione',
      minWidth: 200,
      format: (value) => String(value || '')
    },
    {
      id: 'odlCount' as keyof Part,
      label: 'ODL',
      minWidth: 100,
      format: (_value, row) => String(row?._count?.odls || 0)
    },
    {
      id: 'createdAt',
      label: 'Data Creazione',
      minWidth: 180,
      format: (value) => 
        value ? new Date(value as string).toLocaleString('it-IT') : 'N/A'
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

  // Form fields configuration - organized by sections
  const basicFields: FieldConfig[] = [
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

  const autoclaveFields: FieldConfig[] = [
    {
      name: 'curingCycleId',
      label: 'Ciclo di Cura',
      type: 'select',
      placeholder: 'Seleziona ciclo di cura...',
      gridSize: 6,
      options: curingCycles
    },
    {
      name: 'vacuumLines',
      label: 'Linee Vacuum',
      type: 'number',
      placeholder: '1-10 linee',
      gridSize: 6
    },
    {
      name: 'autoclaveSetupTime',
      label: 'Tempo Setup (min)',
      type: 'number',
      placeholder: 'Minuti',
      gridSize: 6
    },
    {
      name: 'autoclaveLoadPosition',
      label: 'Posizione Carico Preferita',
      type: 'text',
      placeholder: 'Es. Centro, Sinistra...',
      gridSize: 6
    }
  ]

  const cleanroomFields: FieldConfig[] = [
    {
      name: 'resinType',
      label: 'Tipo Resina',
      type: 'text',
      placeholder: 'Es. RTM6, CYCOM977-2...',
      gridSize: 6
    },
    {
      name: 'prepregCode',
      label: 'Codice Prepreg',
      type: 'text',
      placeholder: 'Codice materiale prepreg',
      gridSize: 6
    },
    {
      name: 'cycleTime',
      label: 'Tempo Ciclo (min)',
      type: 'number',
      placeholder: 'Minuti laminazione',
      gridSize: 6
    },
    {
      name: 'roomTemperature',
      label: 'Temperatura Stanza (°C)',
      type: 'number',
      placeholder: '20-25°C',
      gridSize: 6
    }
  ]

  const ndiFields: FieldConfig[] = [
    {
      name: 'inspectionTime',
      label: 'Tempo Ispezione (min)',
      type: 'number',
      placeholder: 'Minuti controllo',
      gridSize: 6
    },
    {
      name: 'calibrationReq',
      label: 'Requisiti Calibrazione',
      type: 'text',
      placeholder: 'Specifiche calibrazione strumenti',
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
            {/* Basic Information */}
            <FormBuilder
              fields={basicFields}
              control={control as any}
              errors={errors}
              columns={2}
              spacing={3}
            />

            {/* Advanced Configuration */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Configurazione Avanzata
              </Typography>
              
              {/* Autoclavi Configuration */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Configurazione Autoclavi</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <FormBuilder
                    fields={autoclaveFields}
                    control={control as any}
                    errors={errors}
                    columns={2}
                    spacing={3}
                  />
                </AccordionDetails>
              </Accordion>

              {/* Clean Room Configuration */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Configurazione Clean Room</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <FormBuilder
                    fields={cleanroomFields}
                    control={control as any}
                    errors={errors}
                    columns={2}
                    spacing={3}
                  />
                </AccordionDetails>
              </Accordion>

              {/* NDI Configuration */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Configurazione NDI</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <FormBuilder
                    fields={ndiFields}
                    control={control as any}
                    errors={errors}
                    columns={2}
                    spacing={3}
                  />
                </AccordionDetails>
              </Accordion>
            </Box>
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
                value: viewPart.partNumber || '-',
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
                label: 'Ciclo di Cura',
                value: viewPart.autoclaveConfig?.curingCycle ? (
                  <Chip label={`${viewPart.autoclaveConfig.curingCycle.code || 'N/A'} - ${viewPart.autoclaveConfig.curingCycle.name || 'N/A'}`} size="small" color="primary" />
                ) : '-',
                type: 'custom' as const,
                size: { xs: 12, sm: 6 }
              },
              {
                label: 'Linee Vacuum',
                value: viewPart.autoclaveConfig?.vacuumLines || '-',
                size: { xs: 12, sm: 6 }
              }
            ]
          },
          {
            title: 'Date',
            fields: [
              {
                label: 'Data Creazione',
                value: viewPart.createdAt || new Date().toISOString(),
                type: 'date' as const,
                size: { xs: 12, sm: 6 }
              },
              {
                label: 'Ultima Modifica',
                value: viewPart.updatedAt || new Date().toISOString(),
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
    part.partTools?.[0]?.tool?.base || '',
    part.partTools?.[0]?.tool?.base || '', // Tool ha solo base e height
    part.partTools?.[0]?.tool?.height || '',
    part.autoclaveConfig?.vacuumLines || '',
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