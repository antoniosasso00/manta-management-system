'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  FormControlLabel,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress
} from '@mui/material'
import { Upload as UploadIcon, Download as DownloadIcon } from '@mui/icons-material'

interface ImportResult {
  created: number
  skipped: number
  errors: Array<{ row: number; email: string; error: string }>
}

interface UserImportProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function UserImport({ open, onClose, onSuccess }: UserImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Seleziona un file CSV valido')
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      throw new Error('Il file deve contenere almeno un header e una riga di dati')
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    // const expectedHeaders = ['nome', 'email', 'password', 'ruolo', 'codice_reparto', 'ruolo_reparto']
    
    // Check if required headers are present
    const requiredHeaders = ['nome', 'email', 'password', 'ruolo']
    const missingHeaders = requiredHeaders.filter(h => !headers.some(header => 
      header.toLowerCase().includes(h.toLowerCase())
    ))
    
    if (missingHeaders.length > 0) {
      throw new Error(`Header mancanti: ${missingHeaders.join(', ')}`)
    }

    const users = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      if (values.length < 4) continue // Skip incomplete rows

      const user: Record<string, string> = {
        name: values[0] || '',
        email: values[1] || '',
        password: values[2] || '',
        role: values[3] || 'OPERATOR'
      }

      if (values[4]) user.departmentCode = values[4]
      if (values[5]) user.departmentRole = values[5]

      // Validate role
      if (!['ADMIN', 'SUPERVISOR', 'OPERATOR'].includes(user.role)) {
        user.role = 'OPERATOR'
      }

      // Validate department role
      if (user.departmentRole && !['CAPO_REPARTO', 'CAPO_TURNO', 'OPERATORE'].includes(user.departmentRole)) {
        user.departmentRole = 'OPERATORE'
      }

      users.push(user)
    }

    return users
  }

  const handleImport = async () => {
    if (!file) {
      setError('Seleziona un file CSV')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const csvText = await file.text()
      const users = parseCSV(csvText)

      const response = await fetch('/api/admin/users/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          users,
          skipDuplicates
        })
      })

      const data = await response.json()

      if (response.ok) {
        setImportResult(data.results)
        if (data.results.created > 0) {
          onSuccess()
        }
      } else {
        setError(data.error || 'Errore durante l\'import')
      }

    } catch (err) {
      console.error('Import error:', err)
      setError(err instanceof Error ? err.message : 'Errore durante l\'import')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadTemplate = () => {
    const template = [
      'nome,email,password,ruolo,codice_reparto,ruolo_reparto',
      'Mario Rossi,mario.rossi@azienda.it,password123,OPERATOR,CL01,OPERATORE',
      'Giuseppe Verdi,giuseppe.verdi@azienda.it,password456,SUPERVISOR,AU01,CAPO_TURNO'
    ].join('\n')

    const blob = new Blob(['\uFEFF' + template], { type: 'text/csv;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_utenti.csv'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const handleClose = () => {
    setFile(null)
    setError(null)
    setImportResult(null)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Import Utenti da CSV</DialogTitle>
      <DialogContent>
        {!importResult ? (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Carica un file CSV con le colonne: nome, email, password, ruolo, codice_reparto (opzionale), ruolo_reparto (opzionale)
              </Typography>
            </Alert>

            <Box display="flex" gap={2} mb={3}>
              <Button
                startIcon={<DownloadIcon />}
                onClick={handleDownloadTemplate}
                variant="outlined"
              >
                Scarica Template
              </Button>
            </Box>

            <Box mb={3}>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button
                  component="span"
                  variant="contained"
                  startIcon={<UploadIcon />}
                  disabled={loading}
                >
                  Seleziona File CSV
                </Button>
              </label>
              {file && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  File selezionato: {file.name}
                </Typography>
              )}
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                />
              }
              label="Salta email duplicate"
            />

            {loading && <LinearProgress sx={{ mt: 2 }} />}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        ) : (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="h6">Import Completato</Typography>
              <Typography>
                Utenti creati: {importResult.created} | 
                Saltati: {importResult.skipped} | 
                Errori: {importResult.errors.length}
              </Typography>
            </Alert>

            {importResult.errors.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>Errori:</Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Riga</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Errore</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {importResult.errors.map((error, index) => (
                        <TableRow key={index}>
                          <TableCell>{error.row}</TableCell>
                          <TableCell>{error.email}</TableCell>
                          <TableCell>
                            <Chip label={error.error} color="error" size="small" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          {importResult ? 'Chiudi' : 'Annulla'}
        </Button>
        {!importResult && (
          <Button
            onClick={handleImport}
            disabled={!file || loading}
            variant="contained"
          >
            Import
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}