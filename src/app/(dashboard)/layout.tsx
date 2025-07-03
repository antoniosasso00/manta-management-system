'use client'

import { ReactNode } from 'react'
import { DashboardLayout } from '@/components/templates/DashboardLayout'

interface DashboardGroupLayoutProps {
  children: ReactNode
}

export default function DashboardGroupLayout({ children }: DashboardGroupLayoutProps) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  )
}