import {
  Dashboard,
  AdminPanelSettings,
  Engineering,
  Schedule,
  Assessment,
  People,
  Factory,
  QrCodeScanner,
  Inventory,
  Analytics,
  Settings,
  CleaningServices,
  Science,
  Construction,
  Build,
  ListAlt,
  LocalFireDepartment,
  Add,
  QrCode2,
  EventNote,
  Hexagon,
  Tune,
  HomeRepairService,
  Brush,
  DirectionsCar,
  VerifiedUser,
} from '@mui/icons-material'

export interface NavigationItem {
  id: string
  label: string
  icon: React.ComponentType
  href: string
  requiredRoles?: string[]
  requiredDepartmentRoles?: string[]
  children?: NavigationItem[]
  divider?: boolean // Per separatori visivi
}

// Configurazione navigazione per ruoli sistema
export const navigationConfig: Record<string, NavigationItem[]> = {
  // ADMIN - Accesso completo a tutto il sistema
  ADMIN: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Dashboard,
      href: '/dashboard',
    },
    {
      id: 'production',
      label: 'Produzione',
      icon: Factory,
      href: '/production',
      children: [
        {
          id: 'production-overview',
          label: 'Overview Produzione',
          icon: Analytics,
          href: '/production',
        },
        {
          id: 'my-department',
          label: 'Il Mio Reparto',
          icon: Factory,
          href: '/my-department',
        },
        {
          id: 'odl-management',
          label: 'Gestione ODL',
          icon: ListAlt,
          href: '/production/odl',
        },
        {
          id: 'qr-scanner',
          label: 'Scanner QR',
          icon: QrCodeScanner,
          href: '/qr-scanner',
        },
        {
          id: 'qr-labels',
          label: 'Stampa Etichette QR',
          icon: QrCode2,
          href: '/qr-labels',
        },
      ],
    },
    {
      id: 'departments',
      label: 'Reparti',
      icon: Engineering,
      href: '#',
      children: [
        // Flusso principale: Clean Room → Autoclave → CN → NDI → Montaggio → Verniciatura
        {
          id: 'production-cleanroom',
          label: 'Clean Room',
          icon: CleaningServices,
          href: '/production/cleanroom',
        },
        {
          id: 'production-autoclave',
          label: 'Autoclavi',
          icon: LocalFireDepartment,
          href: '/production/autoclave',
        },
        {
          id: 'production-controllo-numerico',
          label: 'Controllo Numerico',
          icon: Tune,
          href: '/production/controllo-numerico',
        },
        {
          id: 'production-ndi',
          label: 'NDI',
          icon: Science,
          href: '/production/ndi',
        },
        {
          id: 'production-montaggio',
          label: 'Montaggio',
          icon: HomeRepairService,
          href: '/production/montaggio',
        },
        {
          id: 'production-verniciatura',
          label: 'Verniciatura',
          icon: Brush,
          href: '/production/verniciatura',
        },
        {
          id: 'production-controllo-qualita',
          label: 'Controllo Qualità',
          icon: VerifiedUser,
          href: '/production/controllo-qualita',
        },
        // Reparti separati
        {
          id: 'divider-1',
          label: '---',
          icon: Engineering,
          href: '#',
          divider: true,
        },
        {
          id: 'production-honeycomb',
          label: 'Honeycomb (Separato)',
          icon: Hexagon,
          href: '/production/honeycomb',
        },
        {
          id: 'production-motori',
          label: 'Motori (Separato)',
          icon: DirectionsCar,
          href: '/production/motori',
        },
      ],
    },
    {
      id: 'autoclavi',
      label: 'Autoclavi',
      icon: LocalFireDepartment,
      href: '/autoclavi/batches',
      children: [
        {
          id: 'autoclavi-batches',
          label: 'Gestione Batch',
          icon: ListAlt,
          href: '/autoclavi/batches',
        },
        {
          id: 'autoclavi-create-batch',
          label: 'Nuovo Batch',
          icon: Add,
          href: '/autoclavi/create-batch',
        },
      ],
    },
    {
      id: 'data-management',
      label: 'Dati Master',
      icon: Inventory,
      href: '#',
      divider: true,
      children: [
        {
          id: 'parts-management',
          label: 'Articoli/Parti',
          icon: Construction,
          href: '/parts',
        },
        {
          id: 'tools-management',
          label: 'Strumenti',
          icon: Build,
          href: '/tools',
        },
      ],
    },
    {
      id: 'planning',
      label: 'Pianificazione',
      icon: Schedule,
      href: '/planning',
    },
    {
      id: 'reports',
      label: 'Report',
      icon: Assessment,
      href: '/reports',
    },
    {
      id: 'admin',
      label: 'Amministrazione',
      icon: AdminPanelSettings,
      href: '/admin',
      divider: true,
      children: [
        {
          id: 'admin-dashboard',
          label: 'Dashboard Admin',
          icon: Dashboard,
          href: '/admin',
        },
        {
          id: 'admin-users',
          label: 'Gestione Utenti',
          icon: People,
          href: '/admin/users',
        },
        {
          id: 'admin-departments',
          label: 'Gestione Reparti',
          icon: Factory,
          href: '/admin/departments',
        },
        {
          id: 'admin-audit',
          label: 'Audit Logs',
          icon: EventNote,
          href: '/admin/monitoring/audit',
        },
        {
          id: 'admin-sync',
          label: 'Sincronizzazione Gamma',
          icon: Engineering,
          href: '/admin/sync',
        },
        {
          id: 'admin-settings',
          label: 'Impostazioni Sistema',
          icon: Settings,
          href: '/admin/settings',
        },
      ],
    },
  ],

  // SUPERVISOR - Accesso ai reparti assegnati e supervisione
  SUPERVISOR: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Dashboard,
      href: '/dashboard',
    },
    {
      id: 'production',
      label: 'Produzione',
      icon: Factory,
      href: '/production',
      children: [
        {
          id: 'production-overview',
          label: 'Overview Produzione',
          icon: Analytics,
          href: '/production',
        },
        {
          id: 'my-department',
          label: 'Il Mio Reparto',
          icon: Factory,
          href: '/my-department',
        },
        {
          id: 'odl-management',
          label: 'Gestione ODL',
          icon: ListAlt,
          href: '/production/odl',
        },
        {
          id: 'qr-scanner',
          label: 'Scanner QR',
          icon: QrCodeScanner,
          href: '/qr-scanner',
        },
      ],
    },
    {
      id: 'departments',
      label: 'Reparti',
      icon: Engineering,
      href: '#',
      children: [
        // Flusso principale: Clean Room → Autoclave → CN → NDI → Montaggio → Verniciatura
        {
          id: 'production-cleanroom',
          label: 'Clean Room',
          icon: CleaningServices,
          href: '/production/cleanroom',
        },
        {
          id: 'production-autoclave',
          label: 'Autoclavi',
          icon: LocalFireDepartment,
          href: '/production/autoclave',
        },
        {
          id: 'production-controllo-numerico',
          label: 'Controllo Numerico',
          icon: Tune,
          href: '/production/controllo-numerico',
        },
        {
          id: 'production-ndi',
          label: 'NDI',
          icon: Science,
          href: '/production/ndi',
        },
        {
          id: 'production-montaggio',
          label: 'Montaggio',
          icon: HomeRepairService,
          href: '/production/montaggio',
        },
        {
          id: 'production-verniciatura',
          label: 'Verniciatura',
          icon: Brush,
          href: '/production/verniciatura',
        },
        {
          id: 'production-controllo-qualita',
          label: 'Controllo Qualità',
          icon: VerifiedUser,
          href: '/production/controllo-qualita',
        },
      ],
    },
    {
      id: 'autoclavi',
      label: 'Autoclavi',
      icon: LocalFireDepartment,
      href: '/autoclavi/batches',
    },
    {
      id: 'data-management',
      label: 'Dati Master',
      icon: Inventory,
      href: '#',
      divider: true,
      children: [
        {
          id: 'parts-management',
          label: 'Articoli/Parti',
          icon: Construction,
          href: '/parts',
        },
      ],
    },
    {
      id: 'planning',
      label: 'Pianificazione',
      icon: Schedule,
      href: '/planning',
    },
    {
      id: 'reports',
      label: 'Report',
      icon: Assessment,
      href: '/reports',
    },
  ],

  // OPERATOR - Accesso base al proprio reparto
  OPERATOR: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Dashboard,
      href: '/dashboard',
    },
    {
      id: 'my-department',
      label: 'Il Mio Reparto',
      icon: Factory,
      href: '/my-department',
    },
    {
      id: 'qr-scanner',
      label: 'Scanner QR',
      icon: QrCodeScanner,
      href: '/qr-scanner',
    },
  ],
}

// Configurazione per ruoli reparto specifici
export const departmentNavigationExtensions: Record<string, NavigationItem[]> = {
  // CAPO_REPARTO - Accesso completo al reparto (placeholder - pagine non implementate)
  CAPO_REPARTO: [
    // TODO: Implementare pagine department management
  ],

  // CAPO_TURNO - Gestione turno e operatori (placeholder - pagine non implementate)
  CAPO_TURNO: [
    // TODO: Implementare pagine shift management
  ],

  // OPERATORE - Funzioni base operative
  OPERATORE: [
    // Già incluso nella configurazione OPERATOR base
  ],
}

// Utility per filtrare la navigazione in base ai ruoli utente
export function filterNavigationByRole(
  navigation: NavigationItem[],
  userRole: string,
  departmentRole?: string
): NavigationItem[] {
  return navigation
    .map(item => {
      // Controlla se l'utente può accedere a questo item
      const hasAccess = checkItemAccess(item, userRole, departmentRole)
      
      if (!hasAccess) {
        return null
      }

      // Se ha figli, filtra ricorsivamente
      if (item.children) {
        const filteredChildren = filterNavigationByRole(item.children, userRole, departmentRole)
        return {
          ...item,
          children: filteredChildren.length > 0 ? filteredChildren : undefined,
        }
      }

      return item
    })
    .filter(Boolean) as NavigationItem[]
}

// Controllo accesso per singolo item
function checkItemAccess(
  item: NavigationItem,
  userRole: string,
  departmentRole?: string
): boolean {
  // Se non ci sono restrizioni, accesso consentito
  if (!item.requiredRoles && !item.requiredDepartmentRoles) {
    return true
  }

  // Controlla ruolo sistema
  if (item.requiredRoles && !item.requiredRoles.includes(userRole)) {
    return false
  }

  // Controlla ruolo reparto
  if (item.requiredDepartmentRoles && departmentRole) {
    return item.requiredDepartmentRoles.includes(departmentRole)
  }

  return true
}

// Utility per ottenere la navigazione completa per un utente
export function getNavigationForUser(
  userRole: string,
  departmentRole?: string
): NavigationItem[] {
  const baseNavigation = navigationConfig[userRole] || []
  const departmentExtensions = departmentRole ? departmentNavigationExtensions[departmentRole] || [] : []
  
  // Combina navigazione base e estensioni reparto
  const combinedNavigation = [...baseNavigation, ...departmentExtensions]
  
  // Filtra in base ai permessi
  return filterNavigationByRole(combinedNavigation, userRole, departmentRole)
}