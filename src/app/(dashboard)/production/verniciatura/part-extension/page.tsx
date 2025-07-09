'use client'

import ExtensionTablePage from '@/components/admin/extension-tables/ExtensionTablePage'
import { verniciatureConfig } from '@/components/admin/extension-tables/configs/mockupConfigs'

export default function VerniciaturePartExtensionPage() {
  return (
    <ExtensionTablePage 
      config={verniciatureConfig}
      backUrl="/production/verniciatura"
      mockData={true}
    />
  )
}