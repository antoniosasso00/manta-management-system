'use client'

import ExtensionTablePage from '@/components/admin/extension-tables/ExtensionTablePage'
import { controlloNumericoConfig } from '@/components/admin/extension-tables/configs/mockupConfigs'

export default function ControlloNumericoPartExtensionPage() {
  return (
    <ExtensionTablePage 
      config={controlloNumericoConfig}
      backUrl="/production/controllo-numerico"
      mockData={true}
    />
  )
}