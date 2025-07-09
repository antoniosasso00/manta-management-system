'use client'

import ExtensionTablePage from '@/components/admin/extension-tables/ExtensionTablePage'
import { motoriConfig } from '@/components/admin/extension-tables/configs/mockupConfigs'

export default function MotoriPartExtensionPage() {
  return (
    <ExtensionTablePage 
      config={motoriConfig}
      backUrl="/production/motori"
      mockData={true}
    />
  )
}