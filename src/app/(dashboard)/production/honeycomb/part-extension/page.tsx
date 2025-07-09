'use client'

import ExtensionTablePage from '@/components/admin/extension-tables/ExtensionTablePage'
import { honeycombConfig } from '@/components/admin/extension-tables/configs/mockupConfigs'

export default function HoneycombPartExtensionPage() {
  return (
    <ExtensionTablePage 
      config={honeycombConfig}
      backUrl="/production/honeycomb"
      mockData={true}
    />
  )
}