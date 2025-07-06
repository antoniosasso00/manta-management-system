'use client'

import { useEffect, useState } from 'react'
import { Container } from '@mui/material'
import { RoleBasedAccess } from '@/components/auth/RoleBasedAccess'
import { ProductionDashboard } from '@/components/organisms'

export default function VerniciaturaPag() {
  const [departmentId, setDepartmentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Carica il reparto Verniciatura
    const fetchDepartment = async () => {
      try {
        const response = await fetch('/api/departments')
        if (!response.ok) throw new Error('Errore nel caricamento reparti')
        
        const { departments } = await response.json()
        const verniciaturaDept = departments.find((d: { code: string }) => d.code === 'VR')
        
        if (verniciaturaDept) {
          setDepartmentId(verniciaturaDept.id)
        } else {
          setError('Reparto Verniciatura non trovato')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore sconosciuto')
      } finally {
        setLoading(false)
      }
    }

    fetchDepartment()
  }, [])

  return (
    <RoleBasedAccess 
      requiredRoles={['ADMIN', 'SUPERVISOR']} 
      requiredDepartmentRoles={['CAPO_REPARTO', 'CAPO_TURNO', 'OPERATORE']}
    >
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {loading ? (
          <>Caricamento...</>
        ) : error ? (
          <>Errore: {error}</>
        ) : departmentId ? (
          <ProductionDashboard
            departmentId={departmentId}
            departmentName="Verniciatura - Coating"
            departmentCode="VR"
          />
        ) : null}
      </Container>
    </RoleBasedAccess>
  )
}