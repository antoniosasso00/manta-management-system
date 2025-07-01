'use client'

import { ReactNode } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  Breadcrumbs,
  Link,
} from '@mui/material'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { UserMenu } from '@/components/auth/UserMenu'
import { useAuth } from '@/hooks/useAuth'

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
}

export function DashboardLayout({ children, title, breadcrumbs }: DashboardLayoutProps) {
  const { isAuthenticated } = useAuth()
  const pathname = usePathname()

  // Auto-generate breadcrumbs if not provided
  const autoBreadcrumbs = breadcrumbs || generateBreadcrumbs(pathname)

  if (!isAuthenticated) {
    return <>{children}</>
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
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