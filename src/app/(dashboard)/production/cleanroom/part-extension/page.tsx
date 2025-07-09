'use client'

import ExtensionTablePage from '@/components/admin/extension-tables/ExtensionTablePage'
import { cleanroomConfig } from '@/components/admin/extension-tables/configs/cleanroomConfig'

export default function CleanroomPartExtensionPage() {
  return (
    <ExtensionTablePage 
      config={cleanroomConfig}
      backUrl="/production/cleanroom"
      mockData={true}
    />
  )
}