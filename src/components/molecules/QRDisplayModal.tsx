'use client'

import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material'
import { Print, Download, Close, PictureAsPdf } from '@mui/icons-material'

interface QRDisplayModalProps {
  open: boolean
  onClose: () => void
  odl: {
    id: string
    odlNumber: string
    qrCode?: string | null
    part: {
      partNumber: string
      description: string
    }
    priority: string
    status: string
  } | null
}

export function QRDisplayModal({ open, onClose, odl }: QRDisplayModalProps) {
  if (!odl) return null

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${odl.odlNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              background: white;
            }
            .qr-container {
              text-align: center;
              border: 2px solid #333;
              padding: 20px;
              border-radius: 8px;
              background: white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .qr-code {
              margin: 20px 0;
            }
            .qr-code svg {
              width: 200px !important;
              height: 200px !important;
            }
            .info {
              margin: 10px 0;
              font-size: 14px;
            }
            .odl-number {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 15px;
            }
            .part-info {
              font-size: 12px;
              color: #666;
              margin-top: 15px;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .qr-container { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="odl-number">${odl.odlNumber}</div>
            <div class="qr-code">${odl.qrCode || '<p>QR Code non disponibile</p>'}</div>
            <div class="part-info">
              <div>${odl.part.partNumber}</div>
              <div>${odl.part.description}</div>
              <div>Priorità: ${odl.priority}</div>
              <div>Stato: ${odl.status}</div>
            </div>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }

  const handleDownload = () => {
    if (!odl.qrCode) return

    const blob = new Blob([`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${odl.odlNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            .qr-container { border: 2px solid #333; padding: 20px; display: inline-block; }
            .qr-code svg { width: 200px; height: 200px; }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h2>${odl.odlNumber}</h2>
            <div class="qr-code">${odl.qrCode}</div>
            <p>${odl.part.partNumber} - ${odl.part.description}</p>
          </div>
        </body>
      </html>
    `], { type: 'text/html' })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `QR_${odl.odlNumber}.html`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = async () => {
    if (!odl) return

    try {
      const response = await fetch('/api/reports/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'single-odl',
          odlId: odl.id,
          options: {
            includeQR: true,
            pageFormat: 'A4',
            title: `ODL ${odl.odlNumber}`
          }
        })
      })

      if (!response.ok) {
        throw new Error('Errore generazione PDF')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `odl-${odl.odlNumber}-${new Date().toISOString().split('T')[0]}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PDF Export error:', error)
      // Could add error notification here
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Typography variant="h6">
          QR Code - {odl.odlNumber}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ textAlign: 'center', py: 3 }}>
        <Paper
          elevation={3}
          sx={{
            p: 3,
            display: 'inline-block',
            border: '2px solid',
            borderColor: 'divider',
            borderRadius: 2
          }}
        >
          {/* QR Code Display */}
          <Box sx={{ mb: 2 }}>
            {odl.qrCode ? (
              <Box
                dangerouslySetInnerHTML={{ __html: odl.qrCode }}
                sx={{
                  '& svg': {
                    width: '200px !important',
                    height: '200px !important',
                    display: 'block',
                    margin: '0 auto'
                  }
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 200,
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.100',
                  border: '1px dashed',
                  borderColor: 'grey.400',
                  borderRadius: 1
                }}
              >
                <Typography color="text.secondary">
                  QR Code non disponibile
                </Typography>
              </Box>
            )}
          </Box>

          {/* ODL Info */}
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            {odl.odlNumber}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {odl.part.partNumber}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {odl.part.description}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ 
              px: 1, 
              py: 0.5, 
              bgcolor: 'primary.light', 
              color: 'primary.contrastText', 
              borderRadius: 1 
            }}>
              {odl.priority}
            </Typography>
            <Typography variant="caption" sx={{ 
              px: 1, 
              py: 0.5, 
              bgcolor: 'secondary.light', 
              color: 'secondary.contrastText', 
              borderRadius: 1 
            }}>
              {odl.status}
            </Typography>
          </Box>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Tooltip title="Scarica QR come HTML">
          <Button
            onClick={handleDownload}
            startIcon={<Download />}
            disabled={!odl.qrCode}
          >
            HTML
          </Button>
        </Tooltip>
        
        <Tooltip title="Esporta come PDF">
          <Button
            onClick={handleExportPDF}
            startIcon={<PictureAsPdf />}
            color="secondary"
            disabled={!odl.qrCode}
          >
            PDF
          </Button>
        </Tooltip>
        
        <Tooltip title="Stampa QR Label">
          <Button
            onClick={handlePrint}
            startIcon={<Print />}
            variant="contained"
            disabled={!odl.qrCode}
          >
            Stampa
          </Button>
        </Tooltip>
      </DialogActions>
    </Dialog>
  )
}