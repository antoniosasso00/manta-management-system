'use client'

import { useEffect, useState } from 'react'
import { Container, Box, Typography, Paper, Card, CardContent, Grid, IconButton, Tooltip, Alert, Snackbar } from '@mui/material'
import { Refresh, Timer, Group, Assessment, QrCodeScanner } from '@mui/icons-material'
import { RoleBasedAccess } from '@/components/auth/RoleBasedAccess'
import { DepartmentODLListRefactored } from '@/components/organisms/DepartmentODLListRefactored'
import { DepartmentODLList as DepartmentODLListType, CreateManualEvent } from '@/domains/production'
import { getDepartmentNomenclature, getDepartmentIcon, getDepartmentColors } from '@/config/departmentNomenclature'

export default function ACPage() {
  const [departmentId, setDepartmentId] = useState<string | null>(null)
  const [data, setData] = useState<DepartmentODLListType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  const departmentCode = 'AC'
  const departmentName = 'Autoclavi - Cura'

  const fetchDepartmentData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Prima carica il reparto per ottenere l'ID
      const deptResponse = await fetch('/api/departments')
      if (!deptResponse.ok) throw new Error('Errore nel caricamento reparti')
      
      const { departments } = await deptResponse.json()
      const department = departments.find((d: { code: string }) => d.code === departmentCode)
      
      if (!department) {
        throw new Error('Reparto non trovato')
      }
      
      setDepartmentId(department.id)
      
      // Poi carica i dati ODL del reparto
      const odlResponse = await fetch(`/api/production/odl/department/${department.id}`)
      if (!odlResponse.ok) throw new Error('Errore nel caricamento dati ODL')
      
      const odlData = await odlResponse.json()
      setData(odlData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartmentData()
  }, [])

  const handleTrackingEvent = async (eventData: CreateManualEvent) => {
    try {
      const response = await fetch('/api/production/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      })
      
      if (!response.ok) throw new Error('Errore nella registrazione evento')
      
      setSuccessMessage('Evento registrato con successo')
      await fetchDepartmentData() // Ricarica i dati
    } catch (err) {
      throw err
    }
  }


  return (
    <RoleBasedAccess 
      requiredRoles={['ADMIN', 'SUPERVISOR']} 
      requiredDepartmentRoles={['CAPO_REPARTO', 'CAPO_TURNO', 'OPERATORE']}
    >
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ py: 4 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" gutterBottom>
                {departmentName}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {getDepartmentNomenclature(departmentCode).description}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Scansiona QR">
                <IconButton color="primary" size="large">
                  <QrCodeScanner />
                </IconButton>
              </Tooltip>
              <Tooltip title="Ricarica dati">
                <IconButton onClick={fetchDepartmentData} disabled={loading}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>


          {/* Lista ODL - Nuova Vista Tabellare */}
          {departmentId && (
            <DepartmentODLListRefactored
              departmentId={departmentId}
              data={data || undefined}
              loading={loading}
              error={error || undefined}
              onTrackingEvent={handleTrackingEvent}
              onRefresh={fetchDepartmentData}
              departmentName={departmentName}
              departmentCode={departmentCode}
            />
          )}
        </Box>

        {/* Snackbar per messaggi di successo */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={6000}
          onClose={() => setSuccessMessage(null)}
        >
          <Alert severity="success" onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        </Snackbar>
      </Container>
    </RoleBasedAccess>
  )
}
