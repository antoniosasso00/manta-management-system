'use client'

import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  Divider
} from '@mui/material'
import {
  FolderOpen,
  InsertDriveFile,
  Refresh,
  PlayArrow,
  Visibility,
  ExpandMore,
  ExpandLess,
  Description,
  CheckCircle,
  Error,
  Warning
} from '@mui/icons-material'

interface FileSystemItem {
  name: string
  path: string
  type: 'file' | 'directory'
  isExcel?: boolean
}

interface SyncResult {
  success: boolean
  message: string
  created: number
  updated: number
  skipped: number
  errors: string[]
  totalProcessed: number
}

interface ExcelAnalysis {
  success: boolean
  message: string
  sheets: string[]
  headers: string[]
  sampleData: unknown[][]
}

export function ExcelSyncManager() {
  const [currentPath, setCurrentPath] = useState('/home/antonio/Scaricati')
  const [items, setItems] = useState<FileSystemItem[]>([])
  const [selectedFile, setSelectedFile] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [analysis, setAnalysis] = useState<ExcelAnalysis | null>(null)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [error, setError] = useState<string>('')

  // Carica contenuto cartella
  const browseDirectory = async (path?: string) => {
    const targetPath = path || currentPath
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/sync/browse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: targetPath })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Errore caricamento cartella')
      }

      setCurrentPath(data.currentPath)
      setItems(data.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }

  // Analizza file Excel
  const analyzeFile = async (filePath: string) => {
    setLoading(true)
    setError('')
    setAnalysis(null)

    try {
      const response = await fetch('/api/admin/sync/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, action: 'analyze' })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Errore analisi file')
      }

      setAnalysis(data)
      setShowAnalysis(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }

  // Sincronizza parti
  const syncParts = async () => {
    if (!selectedFile) return

    setSyncing(true)
    setError('')
    setSyncResult(null)

    try {
      const response = await fetch('/api/admin/sync/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: selectedFile, action: 'sync' })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Errore sincronizzazione')
      }

      setSyncResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setSyncing(false)
    }
  }

  // Gestisce click su item
  const handleItemClick = (item: FileSystemItem) => {
    if (item.type === 'directory') {
      browseDirectory(item.path)
    } else if (item.isExcel) {
      setSelectedFile(item.path)
      analyzeFile(item.path)
    }
  }

  // Carica cartella iniziale
  React.useEffect(() => {
    browseDirectory()
  }, [])

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Sincronizzazione File Excel
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* File Browser */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Esplora File
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => browseDirectory()}
              disabled={loading}
            >
              Aggiorna
            </Button>
          </Box>

          <TextField
            fullWidth
            label="Percorso corrente"
            value={currentPath}
            onChange={(e) => setCurrentPath(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && browseDirectory()}
            sx={{ mb: 2 }}
          />

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          <Paper sx={{ maxHeight: 400, overflow: 'auto' }}>
            <List dense>
              {items.map((item, index) => (
                <ListItem
                  key={index}
                  button
                  onClick={() => handleItemClick(item)}
                  selected={selectedFile === item.path}
                >
                  <ListItemIcon>
                    {item.type === 'directory' ? (
                      <FolderOpen color="primary" />
                    ) : item.isExcel ? (
                      <Description color="success" />
                    ) : (
                      <InsertDriveFile />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.name}
                    secondary={item.type === 'file' && item.isExcel ? 'File Excel' : undefined}
                  />
                  {item.isExcel && (
                    <Chip size="small" label="Excel" color="success" />
                  )}
                </ListItem>
              ))}
            </List>
          </Paper>
        </CardContent>
      </Card>

      {/* File Analysis */}
      {analysis && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Analisi File: {selectedFile.split('/').pop()}
              </Typography>
              <IconButton onClick={() => setShowAnalysis(!showAnalysis)}>
                {showAnalysis ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>

            <Alert severity={analysis.success ? 'success' : 'error'} sx={{ mb: 2 }}>
              {analysis.message}
            </Alert>

            <Collapse in={showAnalysis}>
              {analysis.success && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Fogli disponibili: {analysis.sheets.join(', ')}
                  </Typography>
                  
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Intestazioni colonne:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {analysis.headers.map((header, index) => (
                      <Chip
                        key={index}
                        label={header}
                        size="small"
                        color={
                          header.toLowerCase().includes('part') || header.toLowerCase().includes('codice') ? 'primary' :
                          header.toLowerCase().includes('desc') || header.toLowerCase().includes('nome') ? 'secondary' :
                          'default'
                        }
                      />
                    ))}
                  </Box>

                  <Typography variant="subtitle2" gutterBottom>
                    Anteprima dati:
                  </Typography>
                  <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {analysis.headers.map((header, index) => (
                            <TableCell key={index}>{header}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analysis.sampleData.slice(1, 6).map((row, index) => (
                          <TableRow key={index}>
                            {(row as string[]).map((cell, cellIndex) => (
                              <TableCell key={cellIndex}>{cell}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Collapse>
          </CardContent>
        </Card>
      )}

      {/* Sync Controls */}
      {selectedFile && analysis?.success && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Controlli Sincronizzazione
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Visibility />}
                onClick={() => analyzeFile(selectedFile)}
                disabled={loading}
              >
                Rianalizza
              </Button>
              
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={syncParts}
                disabled={syncing || loading}
                color="primary"
              >
                {syncing ? 'Sincronizzazione...' : 'Avvia Sincronizzazione'}
              </Button>
            </Box>

            {syncing && <LinearProgress />}
          </CardContent>
        </Card>
      )}

      {/* Sync Results */}
      {syncResult && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Risultati Sincronizzazione
            </Typography>

            <Alert severity={syncResult.success ? 'success' : 'error'} sx={{ mb: 2 }}>
              {syncResult.message}
            </Alert>

            {syncResult.success && (
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Chip icon={<CheckCircle />} label={`Create: ${syncResult.created}`} color="success" />
                <Chip icon={<Refresh />} label={`Aggiornate: ${syncResult.updated}`} color="info" />
                <Chip icon={<Warning />} label={`Saltate: ${syncResult.skipped}`} color="warning" />
                <Chip label={`Totale: ${syncResult.totalProcessed}`} />
              </Box>
            )}

            {syncResult.errors.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom color="error">
                  Errori riscontrati:
                </Typography>
                <Paper sx={{ p: 2, maxHeight: 200, overflow: 'auto', bgcolor: 'error.light' }}>
                  {syncResult.errors.map((error, index) => (
                    <Typography key={index} variant="body2" color="error.contrastText">
                      {error}
                    </Typography>
                  ))}
                </Paper>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  )
}