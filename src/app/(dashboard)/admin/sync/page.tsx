'use client'

import React from 'react'
import { Box, Typography, Paper } from '@mui/material'
import { ExcelSyncManager } from '@/components/organisms/ExcelSyncManager'

export default function SyncPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Sincronizzazione Gamma MES
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Gestisci la sincronizzazione delle parti dal sistema Gamma MES tramite file Excel/CSV.
        </Typography>
        
        <ExcelSyncManager />
      </Paper>
    </Box>
  )
}