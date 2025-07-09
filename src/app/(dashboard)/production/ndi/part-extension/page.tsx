'use client'

import ExtensionTablePage from '@/components/admin/extension-tables/ExtensionTablePage'
import { ndiConfig } from '@/components/admin/extension-tables/configs/ndiConfig'

export default function NDIPartExtensionPage() {
  return (
    <ExtensionTablePage 
      config={ndiConfig}
      backUrl="/production/ndi"
      mockData={true}
    />
  )
}