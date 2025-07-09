'use client'

import { useState, useEffect, useCallback } from 'react'
import { Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Switch, FormControlLabel, Alert, Box, Typography } from '@mui/material'
import { DataManagementTemplate } from '@/components/templates/DataManagementTemplate'
import { DetailDialog } from '@/components/molecules/DetailDialog'
import { FilterConfig, FilterValues } from '@/components/molecules/FilterPanel'
import { Column } from '@/components/atoms/DataTable'
import { TableAction } from '@/components/molecules/TableActions'
import { Link as LinkIcon } from '@mui/icons-material'
import { useRouter } from 'next/navigation'

interface Tool {
  id: string
  toolPartNumber: string
  description?: string
  base: number
  height: number
  weight?: number
  material?: string
  isActive: boolean
  _count?: {
    partTools: number
  }
}

interface Part {
  id: string
  partNumber: string
  description: string
}

export default function ToolsManagementPage() {
  const router = useRouter()
  const [tools, setTools] = useState<Tool[]>([])
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterValues, setFilterValues] = useState<FilterValues>({})
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false)
  const [openAssociationDialog, setOpenAssociationDialog] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editingTool, setEditingTool] = useState<Tool | null>(null)
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [viewTool, setViewTool] = useState<Tool | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    toolPartNumber: '',
    description: '',
    base: '',
    height: '',
    weight: '',
    material: '',
    isActive: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params: Record<string, string> = {}
      if (searchQuery) params.search = searchQuery
      if (filterValues.material && typeof filterValues.material === 'string') {
        params.material = filterValues.material
      }
      if (filterValues.isActive !== undefined) {
        params.isActive = String(filterValues.isActive)
      }
      
      const queryString = new URLSearchParams(params).toString()
      const [toolsRes, partsRes] = await Promise.all([
        fetch(`/api/admin/tools${queryString ? `?${queryString}` : ''}`),
        fetch('/api/admin/parts')
      ])

      if (toolsRes.ok && partsRes.ok) {
        const [toolsData, partsData] = await Promise.all([
          toolsRes.json(),
          partsRes.json()
        ])
        
        setTools(toolsData)
        setParts(partsData)
      } else {
        throw new Error('Errore nel caricamento dei dati')
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setError(error instanceof Error ? error.message : 'Errore di connessione')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, filterValues])

  const handleAdd = () => {
    setEditingTool(null)
    setIsEditing(false)
    setFormData({
      toolPartNumber: '',
      description: '',
      base: '',
      height: '',
      weight: '',
      material: '',
      isActive: true
    })
    setOpenDialog(true)
  }

  const handleEdit = (tool: Tool) => {
    setEditingTool(tool)
    setIsEditing(true)
    setFormData({
      toolPartNumber: tool.toolPartNumber,
      description: tool.description || '',
      base: tool.base.toString(),
      height: tool.height.toString(),
      weight: tool.weight?.toString() || '',
      material: tool.material || '',
      isActive: tool.isActive
    })
    setOpenDialog(true)
  }

  const handleView = (tool: Tool) => {
    setViewTool(tool)
    setViewDialogOpen(true)
  }

  const handleDelete = async (tool: Tool) => {
    try {
      const response = await fetch(`/api/admin/tools/${tool.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadData()
      } else {
        const data = await response.json()
        setError(data.error || 'Errore nell\'eliminazione')
      }
    } catch (error) {
      console.error('Error deleting tool:', error)
      setError('Errore di connessione')
    }
  }

  const handleOpenAssociations = (tool: Tool) => {
    setSelectedTool(tool)
    setOpenAssociationDialog(true)
  }

  const handleSubmit = async () => {
    try {
      const payload = {
        toolPartNumber: formData.toolPartNumber,
        description: formData.description || null,
        base: parseFloat(formData.base),
        height: parseFloat(formData.height),
        weight: formData.weight ? parseFloat(formData.weight) : null,
        material: formData.material || null,
        isActive: formData.isActive
      }

      const url = editingTool 
        ? `/api/admin/tools/${editingTool.id}`
        : '/api/admin/tools'
      
      const method = editingTool ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setOpenDialog(false)
        setEditingTool(null)
        await loadData()
        setError(null)
      } else {
        const data = await response.json()
        setError(data.error || 'Errore nel salvataggio')
      }
    } catch (error) {
      console.error('Error saving tool:', error)
      setError('Errore di connessione')
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/tools/export')
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'tools-export.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting tools:', error)
      setError('Errore durante l\'esportazione')
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
      id: 'dimensions' as keyof Tool,
      label: 'Dimensioni (m)',
      minWidth: 120,
      format: (_, row) => `${row.base} × ${row.height} m`
    },
    {
      id: 'weight',
      label: 'Peso (kg)',
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
      id: 'associatedParts' as keyof Tool,
      label: 'Parti Associate',
      minWidth: 120,
      format: (_, row) => String(row._count?.partTools || 0)
    }
  ]

  // Filter configuration
  const filters: FilterConfig[] = [
    {
      id: 'material',
      label: 'Materiale',
      type: 'select',
      options: [
        { value: 'Acciaio', label: 'Acciaio' },
        { value: 'Alluminio', label: 'Alluminio' },
        { value: 'Composito', label: 'Composito' },
        { value: 'Fibra di Carbonio', label: 'Fibra di Carbonio' }
      ]
    },
    {
      id: 'isActive',
      label: 'Stato',
      type: 'select',
      options: [
        { value: true, label: 'Attivo' },
        { value: false, label: 'Non Attivo' }
      ]
    }
  ]

  // Custom actions
  const customActions: TableAction<Tool>[] = [
    {
      id: 'associations',
      label: 'Associazioni',
      icon: <LinkIcon />,
      onClick: handleOpenAssociations,
      color: 'secondary'
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
        
        // Page Config
        title="Gestione Strumenti - Admin"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Amministrazione', href: '/dashboard/admin' },
          { label: 'Strumenti' }
        ]}
        
        // CRUD Actions
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        
        // Toolbar Actions
        onSearch={setSearchQuery}
        onExport={handleExport}
        onRefresh={loadData}
        
        // Filter Config
        filters={filters}
        filterValues={filterValues}
        onFilterChange={setFilterValues}
        onFilterApply={loadData}
        onFilterReset={() => {
          setFilterValues({})
          loadData()
        }}
        
        // Custom Actions
        customActions={customActions}
        
        // Table Config
        searchPlaceholder="Cerca per part number, descrizione o materiale..."
        searchValue={searchQuery}
        addLabel="Nuovo Tool"
        exportLabel="Esporta CSV"
        
        // Delete Confirmation
        deleteConfirmTitle={(tool) => `Elimina tool ${tool.toolPartNumber}`}
        deleteConfirmMessage={(tool) => 
          `Sei sicuro di voler eliminare il tool "${tool.toolPartNumber}"? Questa azione non può essere annullata.`
        }
        
        // Empty State
        emptyMessage="Nessun tool trovato"
      />

      {/* Form Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTool ? 'Modifica Tool' : 'Nuovo Tool'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Part Number Tool"
              value={formData.toolPartNumber}
              onChange={(e) => setFormData({ ...formData, toolPartNumber: e.target.value })}
              fullWidth
              required
              helperText="Es: TOOL-001"
            />
            <TextField
              label="Descrizione"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Base (m)"
                type="number"
                value={formData.base}
                onChange={(e) => setFormData({ ...formData, base: e.target.value })}
                fullWidth
                required
                inputProps={{ step: 0.01, min: 0 }}
              />
              <TextField
                label="Altezza (m)"
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                fullWidth
                required
                inputProps={{ step: 0.01, min: 0 }}
              />
            </Box>
            <TextField
              label="Peso (kg)"
              type="number"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              fullWidth
              inputProps={{ step: 0.1, min: 0 }}
            />
            <TextField
              label="Materiale"
              value={formData.material}
              onChange={(e) => setFormData({ ...formData, material: e.target.value })}
              fullWidth
              helperText="Es: Acciaio, Alluminio, Composito"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Tool Attivo"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annulla</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={!formData.toolPartNumber || !formData.base || !formData.height}
          >
            {editingTool ? 'Salva Modifiche' : 'Crea'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Association Dialog */}
      <Dialog 
        open={openAssociationDialog} 
        onClose={() => setOpenAssociationDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Associazioni Part per {selectedTool?.toolPartNumber}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Gestione delle associazioni Part-Tool sarà implementata nella sezione dedicata.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssociationDialog(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <DetailDialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false)
          setViewTool(null)
        }}
        title={viewTool?.toolPartNumber || ''}
        subtitle="Dettagli Tool"
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
                value: `${viewTool.base} m`,
                size: { xs: 12, sm: 4 }
              },
              {
                label: 'Altezza',
                value: `${viewTool.height} m`,
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
            title: 'Associazioni',
            fields: [
              {
                label: 'Parti Associate',
                value: viewTool._count?.partTools || 0,
                size: { xs: 12, sm: 6 }
              }
            ]
          }
        ] : []}
      />
    </>
  )
}