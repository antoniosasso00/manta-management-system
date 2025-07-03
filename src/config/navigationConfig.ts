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
  LocalShipping,
  Science,
  Construction,
  Build,
  ListAlt,
  LocalFireDepartment,
  Add,
  QrCode2,
  Person,
  BugReport,
  EventNote,
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
      href: '/',
    },
    {
      id: 'production',
      label: 'Produzione',
      icon: Engineering,
      href: '/production',
      divider: true,
      children: [
        {
          id: 'production-cleanroom',
          label: 'Clean Room',
          icon: CleaningServices,
          href: '/production/cleanroom',
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
          id: 'production-ndi',
          label: 'NDI',
          icon: Science,
          href: '/production/ndi',
        },
        {
          id: 'qr-scanner',
          label: 'Scanner QR',
          icon: QrCodeScanner,
          href: '/qr-scanner',
        },
        {
          id: 'qr-labels',
          label: 'Stampa QR',
          icon: QrCode2,
          href: '/qr-labels',
        },
      ],
    },
    {
      id: 'data-management',
      label: 'Gestione Dati',
      icon: Inventory,
      href: '/data',
      children: [
        {
          id: 'odl-management',
          label: 'ODL',
          icon: ListAlt,
          href: '/production/odl',
        },
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
          id: 'admin-monitoring',
          label: 'Monitoring & Logs',
          icon: Analytics,
          href: '/admin/monitoring',
          children: [
            {
              id: 'admin-audit',
              label: 'Audit Logs',
              icon: Analytics,
              href: '/admin/monitoring/audit',
            },
            {
              id: 'admin-errors',
              label: 'Error Tracking',
              icon: Analytics,
              href: '/admin/monitoring/errors',
            },
            {
              id: 'admin-performance',
              label: 'Performance Metrics',
              icon: Analytics,
              href: '/admin/monitoring/performance',
            },
          ],
        },
        {
          id: 'admin-settings',
          label: 'Impostazioni Sistema',
          icon: Settings,
          href: '/admin/settings',
        },
      ],
    },
    {
      id: 'testing-role-views',
      label: 'Testing & Role Views',
      icon: BugReport,
      href: '/testing',
      divider: true,
      children: [
        {
          id: 'test-operator-dashboard',
          label: 'Vista Operatore',
          icon: Person,
          href: '/my-department',
        },
        {
          id: 'test-qr-scanner',
          label: 'Scanner QR',
          icon: QrCodeScanner,
          href: '/qr-scanner',
        },
        {
          id: 'test-production-overview',
          label: 'Panoramica Produzione',
          icon: Factory,
          href: '/production',
        },
        {
          id: 'test-department-odl',
          label: 'ODL Reparto',
          icon: ListAlt,
          href: '/my-department/odl',
        },
        {
          id: 'test-department-events',
          label: 'Eventi Reparto',
          icon: Analytics,
          href: '/my-department/events',
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

  // SUPERVISOR - Accesso ai reparti assegnati e supervisione
  SUPERVISOR: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Dashboard,
      href: '/',
    },
    {
      id: 'production',
      label: 'Produzione',
      icon: Engineering,
      href: '/production',
      children: [
        {
          id: 'production-cleanroom',
          label: 'Clean Room',
          icon: CleaningServices,
          href: '/production/cleanroom',
        },
        {
          id: 'production-autoclaves',
          label: 'Autoclavi',
          icon: LocalShipping,
          href: '/production/autoclaves',
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
      id: 'data-management',
      label: 'Gestione Dati',
      icon: Inventory,
      href: '/data',
      children: [
        {
          id: 'odl-management',
          label: 'ODL',
          icon: ListAlt,
          href: '/production/odl',
        },
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
      href: '/',
    },
    {
      id: 'my-department',
      label: 'Il Mio Reparto',
      icon: Factory,
      href: '/my-department',
      children: [
        {
          id: 'my-odl',
          label: 'ODL Attivi',
          icon: ListAlt,
          href: '/my-department/odl',
        },
        {
          id: 'qr-scanner',
          label: 'Scanner QR',
          icon: QrCodeScanner,
          href: '/qr-scanner',
        },
        {
          id: 'my-events',
          label: 'I Miei Eventi',
          icon: Analytics,
          href: '/my-department/events',
        },
      ],
    },
  ],
}

// Configurazione per ruoli reparto specifici
export const departmentNavigationExtensions: Record<string, NavigationItem[]> = {
  // CAPO_REPARTO - Accesso completo al reparto
  CAPO_REPARTO: [
    {
      id: 'department-management',
      label: 'Gestione Reparto',
      icon: Settings,
      href: '/department/management',
      divider: true,
      children: [
        {
          id: 'department-staff',
          label: 'Personale',
          icon: People,
          href: '/department/staff',
        },
        {
          id: 'department-analytics',
          label: 'Analytics Reparto',
          icon: Analytics,
          href: '/department/analytics',
        },
      ],
    },
  ],

  // CAPO_TURNO - Gestione turno e operatori
  CAPO_TURNO: [
    {
      id: 'shift-management',
      label: 'Gestione Turno',
      icon: Schedule,
      href: '/shift/management',
      divider: true,
      children: [
        {
          id: 'shift-operators',
          label: 'Operatori Turno',
          icon: People,
          href: '/shift/operators',
        },
        {
          id: 'shift-analytics',
          label: 'Report Turno',
          icon: Analytics,
          href: '/shift/analytics',
        },
      ],
    },
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