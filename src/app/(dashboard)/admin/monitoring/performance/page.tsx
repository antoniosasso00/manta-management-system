'use client'

import { redirect } from 'next/navigation'
import { useEffect } from 'react'

export default function PerformancePage() {
  useEffect(() => {
    // Reindirizza alla pagina principale monitoring con tab performance attiva
    redirect('/admin/monitoring?tab=performance')
  }, [])

  return null
}