'use client'

import { ReactNode, useState } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  Breadcrumbs,
  Link,
  IconButton,
  useTheme,
} from '@mui/material'
import { Menu as MenuIcon } from '@mui/icons-material'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { UserMenu } from '@/components/auth/UserMenu'
import { useAuth } from '@/hooks/useAuth'
import { NavigationSidebar, useSidebar } from '@/components/organisms/NavigationSidebar'

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
}

export function DashboardLayout({ children, title, breadcrumbs }: DashboardLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const pathname = usePathname()
  const theme = useTheme()
  const { isMobile, defaultOpen, sidebarWidth, sidebarCollapsedWidth } = useSidebar()
  
  // Stato sidebar
  const [sidebarOpen, setSidebarOpen] = useState(defaultOpen)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Auto-generate breadcrumbs if not provided
  const autoBreadcrumbs = breadcrumbs || generateBreadcrumbs(pathname)

  // Show loading state during authentication check to prevent hydration mismatch
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    )
  }

  if (!isAuthenticated) {
    return <>{children}</>
  }

  const handleDrawerToggle = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleDrawerClose = () => {
    setSidebarOpen(false)
  }

  const handleToggleCollapsed = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  // Calcola il margine left per il contenuto principale
  const getMainContentMarginLeft = () => {
    if (isMobile) return 0
    if (!sidebarOpen) return 0
    return sidebarCollapsed ? sidebarCollapsedWidth : sidebarWidth
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <NavigationSidebar
        open={sidebarOpen}
        onClose={handleDrawerClose}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={handleToggleCollapsed}
        variant={isMobile ? 'temporary' : 'persistent'}
      />

      {/* Main Content Area */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          ml: `${getMainContentMarginLeft()}px`,
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        {/* App Bar */}
        <AppBar 
          position="static" 
          elevation={1}
          sx={{
            zIndex: theme.zIndex.drawer + 1,
          }}
        >
          <Toolbar>
            {/* Menu button per mobile */}
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              <Link 
                component={NextLink} 
                href="/" 
                color="inherit" 
                underline="none"
                sx={{ fontWeight: 'bold' }}
              >
                MES Aerospazio
              </Link>
            </Typography>
            
            <UserMenu />
          </Toolbar>
        </AppBar>

        {/* Breadcrumbs */}
        {autoBreadcrumbs.length > 0 && (
          <Box sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
            <Container maxWidth="xl" sx={{ py: 1 }}>
              <Breadcrumbs aria-label="breadcrumb">
                {autoBreadcrumbs.map((crumb, index) => (
                  <div key={index}>
                    {crumb.href && index < autoBreadcrumbs.length - 1 ? (
                      <Link component={NextLink} href={crumb.href} color="inherit">
                        {crumb.label}
                      </Link>
                    ) : (
                      <Typography color="text.primary">{crumb.label}</Typography>
                    )}
                  </div>
                ))}
              </Breadcrumbs>
            </Container>
          </Box>
        )}

        {/* Page Title */}
        {title && (
          <Container maxWidth="xl" sx={{ mt: 3, mb: 2 }}>
            <Typography variant="h4" component="h1">
              {title}
            </Typography>
          </Container>
        )}

        {/* Main Content */}
        <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
          {children}
        </Box>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            py: 3,
            px: 2,
            mt: 'auto',
            backgroundColor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Container maxWidth="xl">
            <Typography variant="body2" color="text.secondary" align="center">
              © 2024 MES Aerospazio - Manufacturing Execution System
            </Typography>
          </Container>
        </Box>
      </Box>
    </Box>
  )
}

/**
 * Generate breadcrumbs from pathname
 */
function generateBreadcrumbs(pathname: string): Array<{ label: string; href?: string }> {
  const paths = pathname.split('/').filter(Boolean)
  
  if (paths.length === 0) {
    return [{ label: 'Dashboard', href: '/' }]
  }

  const breadcrumbs: Array<{ label: string; href?: string }> = [{ label: 'Dashboard', href: '/' }]
  
  let currentPath = ''
  
  paths.forEach((path, index) => {
    currentPath += `/${path}`
    
    const label = formatPathLabel(path)
    const isLast = index === paths.length - 1
    
    const breadcrumb: { label: string; href?: string } = { label }
    if (!isLast) {
      breadcrumb.href = currentPath
    }
    breadcrumbs.push(breadcrumb)
  })

  return breadcrumbs
}

/**
 * Format path segment into readable label
 */
function formatPathLabel(path: string): string {
  // Handle special cases
  const specialLabels: Record<string, string> = {
    'admin': 'Amministrazione',
    'users': 'Utenti',
    'profile': 'Profilo',
    'change-password': 'Cambia Password',
    'reset-password': 'Reset Password',
    'forgot-password': 'Recupera Password',
    'odl': 'ODL',
    'production': 'Produzione',
    'autoclaves': 'Autoclavi',
    'departments': 'Reparti',
    'reports': 'Report',
    'cleanroom': 'Clean Room',
    'parts': 'Parti',
    'planning': 'Pianificazione',
    'ndi': 'NDI',
    'my-department': 'Il Mio Reparto',
    'qr-scanner': 'Scanner QR',
    'events': 'Eventi',
  }

  if (specialLabels[path]) {
    return specialLabels[path]
  }

  // Convert kebab-case to title case
  return path
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}