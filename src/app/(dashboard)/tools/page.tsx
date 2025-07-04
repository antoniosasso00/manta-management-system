'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Skeleton,
  Tooltip
} from '@mui/material'
import {
  Build,
  Add,
  Search,
  Edit,
  Delete,
  Visibility
} from '@mui/icons-material'
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
  const [filteredTools, setFilteredTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [toolFormOpen, setToolFormOpen] = useState(false)
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)

  useEffect(() => {
    loadTools()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, tools])

  const loadTools = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/tools')
      if (response.ok) {
        const data = await response.json()
        setTools(data)
      } else {
        // Dati mock per sviluppo
        setTools([
          {
            id: '1',
            toolPartNumber: 'STR-001',
            description: 'Stampo pannello laterale',
            base: 1200,
            height: 800,
            weight: 25.5,
            material: 'Acciaio inox 316L',
            isActive: true,
            associatedParts: 3,
            parts: [],
            createdAt: '2024-06-15T10:00:00Z',
            updatedAt: '2024-06-15T10:00:00Z'
          },
          {
            id: '2',
            toolPartNumber: 'UTL-002',
            description: 'Utensile taglio carbonio',
            base: 300,
            height: 200,
            weight: 12.8,
            material: 'Fibra di carbonio',
            isActive: true,
            associatedParts: 8,
            parts: [],
            createdAt: '2024-06-20T14:30:00Z',
            updatedAt: '2024-06-20T14:30:00Z'
          },
          {
            id: '3',
            toolPartNumber: 'STR-003',
            description: 'Forma longherone principale',
            base: 2000,
            height: 400,
            material: 'Alluminio 7075',
            isActive: false,
            associatedParts: 1,
            parts: [],
            createdAt: '2024-05-10T09:15:00Z',
            updatedAt: '2024-05-10T09:15:00Z'
          }
        ])
      }
    } catch (error) {
      console.error('Error loading tools:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...tools]

    if (searchTerm) {
      filtered = filtered.filter(tool =>
        tool.toolPartNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tool.description && tool.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        tool.material.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredTools(filtered)
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'error'
  }

  const getStatusLabel = (isActive: boolean) => {
    return isActive ? 'Attivo' : 'Non Attivo'
  }

  const formatDimensions = (base: number, height: number) => {
    return `${base} × ${height} mm`
  }

  const formatWeight = (weight?: number) => {
    return weight ? `${weight} kg` : '-'
  }

  const handleCreateTool = () => {
    setSelectedTool(null)
    setToolFormOpen(true)
  }

  const handleEditTool = (tool: Tool) => {
    setSelectedTool({
      ...tool,
      associatedParts: tool.parts
    })
    setToolFormOpen(true)
  }

  const handleToolSubmit = async (data: CreateToolWithPartsInput | UpdateToolWithPartsInput) => {
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

    await loadTools()
  }

  const handleDeleteTool = async (tool: Tool) => {
    if (!confirm(`Sei sicuro di voler eliminare lo strumento ${tool.toolPartNumber}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/tools/${tool.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadTools()
      } else {
        const error = await response.json()
        alert(error.error || 'Errore nell\'eliminazione')
      }
    } catch (error) {
      alert('Errore di connessione')
    }
  }

  if (loading) {
    return (
      <Box className="p-4 space-y-4">
        <Skeleton variant="rectangular" height={60} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    )
  }

  return (
    <Box className="p-4 space-y-6">
      {/* Header */}
      <Box className="flex items-center justify-between">
        <Typography variant="h4" className="flex items-center gap-2">
          <Build />
          Gestione Strumenti
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateTool}
        >
          Nuovo Strumento
        </Button>
      </Box>

      {/* Search */}
      <Card>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Cerca per codice, nome o tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Tools Table */}
      <Card>
        <CardContent>
          <Box className="flex items-center justify-between mb-4">
            <Typography variant="h6">
              Strumenti ({filteredTools.length})
            </Typography>
          </Box>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Part Number</TableCell>
                  <TableCell>Descrizione</TableCell>
                  <TableCell>Dimensioni (mm)</TableCell>
                  <TableCell>Peso</TableCell>
                  <TableCell>Materiale</TableCell>
                  <TableCell>Stato</TableCell>
                  <TableCell>Parti Associate</TableCell>
                  <TableCell>Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTools.map((tool) => (
                  <TableRow key={tool.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {tool.toolPartNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {tool.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDimensions(tool.base, tool.height)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatWeight(tool.weight)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {tool.material || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(tool.isActive)}
                        color={getStatusColor(tool.isActive)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="primary">
                        {tool.associatedParts}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box className="flex gap-1">
                        <Tooltip title="Visualizza dettagli">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifica">
                          <IconButton size="small" onClick={() => handleEditTool(tool)}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Elimina">
                          <IconButton size="small" color="error" onClick={() => handleDeleteTool(tool)}>
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTools.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="textSecondary">
                        Nessuno strumento trovato
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Enhanced Tool Form */}
      <ToolForm
        open={toolFormOpen}
        onClose={() => setToolFormOpen(false)}
        tool={selectedTool}
        onSubmit={handleToolSubmit}
      />
    </Box>
  )
}