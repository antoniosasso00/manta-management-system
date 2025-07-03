'use client'

import { redirect } from 'next/navigation'
import { useEffect } from 'react'

export default function AuditPage() {
  useEffect(() => {
    // Reindirizza alla pagina principale monitoring con tab audit attiva
    redirect('/admin/monitoring?tab=audit')
  }, [])

  return null
}