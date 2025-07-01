'use client'

import { useState, useEffect, useCallback } from 'react'
import { Container, Alert } from '@mui/material'
import { PartsTable } from '@/components/organisms/PartsTable'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import type { CreatePartInput, UpdatePartInput, PartQueryInput } from '@/domains/core/schemas/part.schema'

interface Part {
  id: string
  partNumber: string
  description: string
  standardLength?: number | null
  standardWidth?: number | null
  standardHeight?: number | null
  defaultVacuumLines?: number | null
  createdAt: Date
  updatedAt: Date
  defaultCuringCycle?: {
    id: string
    code: string
    name: string
  } | null
  _count: {
    odls: number
    partTools: number
  }
}

interface CuringCycle {
  id: string
  code: string
  name: string
}

interface PartsResponse {
  data: Part[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasMore: boolean
  }
}

export default function PartsPage() {
  const [parts, setParts] = useState<Part[]>([])
  const [curingCycles, setCuringCycles] = useState<CuringCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState<PartQueryInput>({
    page: 1,
    limit: 10,
    sortBy: 'partNumber',
    sortOrder: 'asc',
  })
  const [totalCount, setTotalCount] = useState(0)

  const fetchParts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (query.search) params.append('search', query.search)
      params.append('page', query.page.toString())
      params.append('limit', query.limit.toString())
      params.append('sortBy', query.sortBy)
      params.append('sortOrder', query.sortOrder)

      const response = await fetch(`/api/parts?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch parts')
      }

      const data: PartsResponse = await response.json()
      
      // Convert date strings to Date objects
      const partsWithDates = data.data.map(part => ({
        ...part,
        createdAt: new Date(part.createdAt),
        updatedAt: new Date(part.updatedAt),
      }))
      
      setParts(partsWithDates)
      setTotalCount(data.pagination.totalCount)
    } catch (error) {
      console.error('Error fetching parts:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch parts')
    } finally {
      setLoading(false)
    }
  }, [query])

  const fetchCuringCycles = useCallback(async () => {
    try {
      const response = await fetch('/api/curing-cycles')
      
      if (!response.ok) {
        console.warn('Failed to fetch curing cycles')
        return
      }

      const data = await response.json()
      setCuringCycles(data.data || [])
    } catch (error) {
      console.warn('Error fetching curing cycles:', error)
    }
  }, [])

  useEffect(() => {
    fetchParts()
  }, [fetchParts])

  useEffect(() => {
    fetchCuringCycles()
  }, [fetchCuringCycles])

  const handleQueryChange = useCallback((newQuery: Partial<PartQueryInput>) => {
    setQuery(prev => ({ ...prev, ...newQuery }))
  }, [])

  const handleCreatePart = async (data: CreatePartInput) => {
    const response = await fetch('/api/parts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create part')
    }

    // Refresh the parts list
    await fetchParts()
  }

  const handleUpdatePart = async (id: string, data: UpdatePartInput) => {
    const response = await fetch(`/api/parts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update part')
    }

    // Refresh the parts list
    await fetchParts()
  }

  const handleDeletePart = async (id: string) => {
    const response = await fetch(`/api/parts/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to delete part')
    }

    // Refresh the parts list
    await fetchParts()
  }

  return (
    <DashboardLayout title="Gestione Parti">
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <PermissionGuard
          table="parts"
          action="canView"
          showError
          fallback={
            <Alert severity="error">
              You do not have permission to view parts.
            </Alert>
          }
        >
          <PartsTable
            data={parts}
            loading={loading}
            totalCount={totalCount}
            query={query}
            onQueryChange={handleQueryChange}
            onCreatePart={handleCreatePart}
            onUpdatePart={handleUpdatePart}
            onDeletePart={handleDeletePart}
            curingCycles={curingCycles}
          />
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </PermissionGuard>
      </Container>
    </DashboardLayout>
  )
}