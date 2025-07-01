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
      id: 'admin',
      label: 'Amministrazione',
      icon: AdminPanelSettings,
      href: '/admin',
      children: [
        {
          id: 'admin-users',
          label: 'Utenti',
          icon: People,
          href: '/admin/users',
        },
        {
          id: 'admin-departments',
          label: 'Reparti',
          icon: Factory,
          href: '/admin/departments',
        },
        {
          id: 'admin-settings',
          label: 'Impostazioni',
          icon: Settings,
          href: '/admin/settings',
        },
      ],
    },
    {
      id: 'production',
      label: 'Produzione',
      icon: Engineering,
      href: '/production',
      divider: true,
      children: [
        {
          id: 'production-odl',
          label: 'ODL',
          icon: Inventory,
          href: '/production/odl',
        },
        {
          id: 'production-parts',
          label: 'Parti',
          icon: Construction,
          href: '/parts',
        },
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
          id: 'production-ndi',
          label: 'NDI',
          icon: Science,
          href: '/production/ndi',
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
          id: 'production-odl',
          label: 'ODL',
          icon: Inventory,
          href: '/production/odl',
        },
        {
          id: 'production-parts',
          label: 'Parti',
          icon: Construction,
          href: '/parts',
        },
        // I reparti specifici saranno filtrati dinamicamente
        {
          id: 'production-cleanroom',
          label: 'Clean Room',
          icon: CleaningServices,
          href: '/production/cleanroom',
          requiredDepartmentRoles: ['CAPO_REPARTO', 'CAPO_TURNO'],
        },
        {
          id: 'production-autoclaves',
          label: 'Autoclavi',
          icon: LocalShipping,
          href: '/production/autoclaves',
          requiredDepartmentRoles: ['CAPO_REPARTO', 'CAPO_TURNO'],
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
          icon: Inventory,
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
      children: [
        {
          id: 'department-staff',
          label: 'Personale',
          icon: People,
          href: '/department/staff',
        },
        {
          id: 'department-analytics',
          label: 'Analytics',
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
      children: [
        {
          id: 'shift-operators',
          label: 'Operatori Turno',
          icon: People,
          href: '/shift/operators',
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