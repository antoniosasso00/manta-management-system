'use client'

import ExtensionTablePage from '@/components/admin/extension-tables/ExtensionTablePage'
import { autoclaveConfig } from '@/components/admin/extension-tables/configs/autoclaveConfig'

export default function AutoclavePartExtensionPage() {
  return (
    <ExtensionTablePage 
      config={autoclaveConfig}
      backUrl="/production/autoclave"
      mockData={false}
    />
  )
}