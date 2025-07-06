'use client'

import { useEffect, useState } from 'react'
import { Container } from '@mui/material'
import { RoleBasedAccess } from '@/components/auth/RoleBasedAccess'
import { ProductionDashboard } from '@/components/organisms'

export default function AutoclavePage() {
  const [departmentId, setDepartmentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Carica il reparto Autoclave
    const fetchDepartment = async () => {
      try {
        const response = await fetch('/api/departments')
        if (!response.ok) throw new Error('Errore nel caricamento reparti')
        
        const { departments } = await response.json()
        const autoclave = departments.find((d: { code: string }) => d.code === 'AC')
        
        if (autoclave) {
          setDepartmentId(autoclave.id)
        } else {
          setError('Reparto Autoclave non trovato')
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
            departmentName="Autoclavi - Cura"
            departmentCode="AC"
          />
        ) : null}
      </Container>
    </RoleBasedAccess>
  )
}