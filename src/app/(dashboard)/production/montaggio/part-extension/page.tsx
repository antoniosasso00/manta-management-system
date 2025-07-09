'use client'

import ExtensionTablePage from '@/components/admin/extension-tables/ExtensionTablePage'
import { montaggioConfig } from '@/components/admin/extension-tables/configs/mockupConfigs'

export default function MontaggioPartExtensionPage() {
  return (
    <ExtensionTablePage 
      config={montaggioConfig}
      backUrl="/production/montaggio"
      mockData={true}
    />
  )
}