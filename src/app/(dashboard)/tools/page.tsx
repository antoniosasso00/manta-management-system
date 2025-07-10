'use client'

import { useState, useEffect, useCallback } from 'react'
import { Chip } from '@mui/material'
import { DataManagementTemplate } from '@/components/templates/DataManagementTemplate'
import { DetailDialog, DetailSection } from '@/components/molecules/DetailDialog'
import { FilterConfig, FilterValues } from '@/components/molecules/FilterPanel'
import { Column } from '@/components/atoms/DataTable'
import ToolForm from '@/components/organisms/ToolForm'
import { CreateToolWithPartsInput, UpdateToolWithPartsInput } from '@/domains/core/schemas/tool.schema'

interface Part {
  id: string
  partNumber: string
  description?: string
  isActive: boolean
}

interface Tool {
  id: string
  toolPartNumber: string
  description?: string
  base: number
  height: number
  weight?: number
  material?: string
  isActive: boolean
  associatedParts: number
  parts: Part[]
  createdAt: string
  updatedAt: string
}

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterValues, setFilterValues] = useState<FilterValues>({})
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [sortBy, setSortBy] = useState<string>('toolPartNumber')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [toolFormOpen, setToolFormOpen] = useState(false)
  const [selectedTool, setSelectedTool] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewTool, setViewTool] = useState<Tool | null>(null)

  useEffect(() => {
    loadTools()
  }, [searchQuery, filterValues, page, rowsPerPage, sortBy, sortOrder])

  const loadTools = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params: Record<string, string | number> = {
        page: page + 1, // API usa paginazione 1-based
        limit: rowsPerPage,
        sortBy,
        sortOrder
      }
      
      if (searchQuery) params.search = searchQuery
      if (filterValues.material && typeof filterValues.material === 'string') {
        params.material = filterValues.material
      }
      if (filterValues.isActive !== undefined) {
        params.isActive = String(filterValues.isActive)
      }
      
      const queryString = new URLSearchParams(params as Record<string, string>).toString()
      const response = await fetch(`/api/tools${queryString ? `?${queryString}` : ''}`)
      
      if (response.ok) {
        const result = await response.json()
        setTools(result.data)
        setTotalCount(result.meta.total)
      } else {
        throw new Error('Errore nel caricamento degli strumenti')
      }
    } catch (error) {
      console.error('Error loading tools:', error)
      setError(error instanceof Error ? error.message : 'Errore caricamento strumenti')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, filterValues, page, rowsPerPage, sortBy, sortOrder])

  const handleAdd = () => {
    setSelectedTool(null)
    setIsEditing(false)
    setToolFormOpen(true)
  }

  const handleEdit = (tool: Tool) => {
    const toolForForm = {
      id: tool.id,
      toolPartNumber: tool.toolPartNumber,
      description: tool.description,
      base: tool.base,
      height: tool.height,
      weight: tool.weight,
      material: tool.material,
      isActive: tool.isActive,
      associatedParts: tool.parts || []
    }
    setSelectedTool(toolForForm)
    setIsEditing(true)
    setToolFormOpen(true)
  }

  const handleView = (tool: Tool) => {
    setViewTool(tool)
    setViewDialogOpen(true)
  }

  const handleDelete = async (tool: Tool) => {
    try {
      const response = await fetch(`/api/tools/${tool.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadTools()
      } else {
        const error = await response.json()
        setError(error.error || 'Errore nell\'eliminazione')
      }
    } catch (error) {
      console.error('Error deleting tool:', error)
      setError('Errore di connessione')
    }
  }

  const handleToolSubmit = async (data: CreateToolWithPartsInput | UpdateToolWithPartsInput) => {
    try {
      const url = selectedTool ? `/api/tools/${selectedTool.id}` : '/api/tools'
      const method = selectedTool ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Errore nel salvataggio')
      }

      setToolFormOpen(false)
      setSelectedTool(null)
      setPage(0) // Reset alla prima pagina dopo create/update
      await loadTools()
    } catch (error) {
      console.error('Error saving tool:', error)
      setError(error instanceof Error ? error.message : 'Errore nel salvataggio')
    }
  }

  // Table columns
  const columns: Column<Tool>[] = [
    {
      id: 'toolPartNumber',
      label: 'Part Number',
      minWidth: 150,
      format: (value) => <strong>{String(value)}</strong>
    },
    {
      id: 'description',
      label: 'Descrizione',
      minWidth: 200,
      format: (value) => String(value || '-')
    },
    {
      id: 'base' as keyof Tool,
      label: 'Dimensioni (mm)',
      minWidth: 120,
      format: (_, row) => `${row.base} × ${row.height} mm`
    },
    {
      id: 'weight',
      label: 'Peso',
      minWidth: 100,
      format: (value) => value ? `${value} kg` : '-'
    },
    {
      id: 'material',
      label: 'Materiale',
      minWidth: 120,
      format: (value) => String(value || '-')
    },
    {
      id: 'isActive',
      label: 'Stato',
      minWidth: 100,
      format: (value) => (
        <Chip
          label={value ? 'Attivo' : 'Non Attivo'}
          color={value ? 'success' : 'error'}
          size="small"
        />
      )
    },
    {
      id: 'associatedParts',
      label: 'Parti Associate',
      minWidth: 120,
      format: (value) => String(value || 0)
    }
  ]

  // Filter configuration
  const filters: FilterConfig[] = [
    {
      id: 'material',
      label: 'Materiale',
      type: 'select',
      options: [
        { value: 'Alluminio 7075', label: 'Alluminio 7075' },
        { value: 'Acciaio Inox', label: 'Acciaio Inox' },
        { value: 'Fibra di Carbonio', label: 'Fibra di Carbonio' },
        { value: 'Acciaio Temprato', label: 'Acciaio Temprato' }
      ]
    },
    {
      id: 'isActive',
      label: 'Stato',
      type: 'select',
      options: [
        { value: 'true', label: 'Attivo' },
        { value: 'false', label: 'Non Attivo' }
      ]
    }
  ]

  return (
    <>
      <DataManagementTemplate
        // Data
        data={tools}
        columns={columns}
        loading={loading}
        error={error}
        totalCount={totalCount}
        
        // Page Config
        title="Gestione Strumenti"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Dati Master' },
          { label: 'Strumenti' }
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
        onRefresh={() => {
          setPage(0)
          loadTools()
        }}
        
        // Filter Config
        filters={filters}
        filterValues={filterValues}
        onFilterChange={setFilterValues}
        onFilterApply={() => {
          setPage(0) // Reset alla prima pagina quando si applicano filtri
          loadTools()
        }}
        onFilterReset={() => {
          setFilterValues({})
          setPage(0)
          loadTools()
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
        searchPlaceholder="Cerca per codice, nome o materiale..."
        searchValue={searchQuery}
        addLabel="Nuovo Strumento"
        
        // Delete Confirmation
        deleteConfirmTitle={(tool) => `Elimina strumento ${tool.toolPartNumber}`}
        deleteConfirmMessage={(tool) => 
          `Sei sicuro di voler eliminare lo strumento "${tool.toolPartNumber}"? Questa azione non può essere annullata.`
        }
        
        // Empty State
        emptyMessage="Nessuno strumento trovato"
      />

      {/* Tool Form */}
      <ToolForm
        open={toolFormOpen}
        onClose={() => {
          setToolFormOpen(false)
          setSelectedTool(null)
        }}
        tool={selectedTool}
        onSubmit={handleToolSubmit}
      />

      {/* Detail Dialog */}
      <DetailDialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false)
          setViewTool(null)
        }}
        title={viewTool?.toolPartNumber || ''}
        subtitle="Dettagli Strumento"
        sections={viewTool ? [
          {
            title: 'Informazioni Generali',
            fields: [
              {
                label: 'Part Number',
                value: viewTool.toolPartNumber,
                size: { xs: 12, sm: 6 }
              },
              {
                label: 'Descrizione',
                value: viewTool.description || '-',
                size: { xs: 12, sm: 6 }
              },
              {
                label: 'Materiale',
                value: viewTool.material || '-',
                size: { xs: 12, sm: 6 }
              },
              {
                label: 'Stato',
                value: (
                  <Chip
                    label={viewTool.isActive ? 'Attivo' : 'Non Attivo'}
                    color={viewTool.isActive ? 'success' : 'error'}
                    size="small"
                  />
                ),
                type: 'custom' as const,
                size: { xs: 12, sm: 6 }
              }
            ]
          },
          {
            title: 'Dimensioni e Peso',
            fields: [
              {
                label: 'Base',
                value: `${viewTool.base} mm`,
                size: { xs: 12, sm: 4 }
              },
              {
                label: 'Altezza',
                value: `${viewTool.height} mm`,
                size: { xs: 12, sm: 4 }
              },
              {
                label: 'Peso',
                value: viewTool.weight ? `${viewTool.weight} kg` : '-',
                size: { xs: 12, sm: 4 }
              }
            ]
          },
          {
            title: 'Parti Associate',
            fields: [
              {
                label: 'Numero Parti',
                value: viewTool.associatedParts,
                size: { xs: 12, sm: 6 }
              }
            ]
          },
          {
            title: 'Date',
            fields: [
              {
                label: 'Data Creazione',
                value: viewTool.createdAt,
                type: 'date' as const,
                size: { xs: 12, sm: 6 }
              },
              {
                label: 'Ultima Modifica',
                value: viewTool.updatedAt,
                type: 'date' as const,
                size: { xs: 12, sm: 6 }
              }
            ]
          }
        ] : []}
      />
    </>
  )
}