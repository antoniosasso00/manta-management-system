'use client'

import { redirect } from 'next/navigation'
import { useEffect } from 'react'

export default function ErrorsPage() {
  useEffect(() => {
    // Reindirizza alla pagina principale monitoring con tab errori attiva
    redirect('/admin/monitoring?tab=errors')
  }, [])

  return null
}