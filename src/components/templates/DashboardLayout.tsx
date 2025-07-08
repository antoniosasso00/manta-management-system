'use client'

import { ReactNode, useState, useEffect } from 'react'
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
  useMediaQuery,
  Slide,
  useScrollTrigger,
  Fab,
  Zoom,
} from '@mui/material'
import { Menu as MenuIcon, KeyboardArrowUp as KeyboardArrowUpIcon } from '@mui/icons-material'
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
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 100 })
  
  // Stato per evitare hydration mismatch
  const [mounted, setMounted] = useState(false)
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  
  // Stato sidebar
  const [sidebarOpen, setSidebarOpen] = useState(defaultOpen)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  // ScrollToTop handler
  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  // Timeout fallback per loading infinito
  useEffect(() => {
    if (isLoading && mounted) {
      const timer = setTimeout(() => {
        console.warn('Auth loading timeout - treating as unauthenticated')
        setLoadingTimeout(true)
      }, 10000) // 10 secondi timeout

      return () => clearTimeout(timer)
    } else {
      setLoadingTimeout(false)
    }
  }, [isLoading, mounted])

  // Auto-generate breadcrumbs if not provided
  const autoBreadcrumbs = breadcrumbs || generateBreadcrumbs(pathname)

  // Show loading state during authentication check and mount to prevent hydration mismatch
  if ((isLoading && !loadingTimeout) || !mounted) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading...</Typography>
        {loadingTimeout && (
          <Typography variant="body2" color="error" sx={{ ml: 2 }}>
            Authentication timeout - please refresh the page
          </Typography>
        )}
      </Box>
    )
  }

  // Show error message if not authenticated (let middleware handle redirects)
  if (!isAuthenticated || loadingTimeout) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Not authenticated. Please log in.</Typography>
      </Box>
    )
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
        {/* App Bar con Hide on Scroll per mobile */}
        <Slide appear={false} direction="down" in={!trigger || !isMobile}>
          <AppBar 
            position={isMobile ? 'fixed' : 'static'} 
            elevation={1}
            sx={{
              zIndex: theme.zIndex.drawer + 1,
              top: 0,
              left: isMobile ? 0 : 'auto',
              right: 0,
              width: isMobile ? '100%' : 'auto',
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
                sx={{ 
                  mr: 2,
                  width: 48,
                  height: 48,
                }}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            <Typography variant={isSmallMobile ? 'body1' : 'h6'} component="div" sx={{ flexGrow: 1 }}>
              <Link 
                component={NextLink} 
                href="/dashboard" 
                color="inherit" 
                underline="none"
                sx={{ 
                  fontWeight: 'bold',
                  display: 'block',
                  lineHeight: 1.2,
                }}
              >
                {isSmallMobile ? 'Produzione' : 'Gestione Produzione'}
              </Link>
            </Typography>
            
            <UserMenu />
          </Toolbar>
        </AppBar>
      </Slide>

        {/* Breadcrumbs - nascosti su mobile piccoli */}
        {autoBreadcrumbs.length > 0 && !isSmallMobile && (
          <Box sx={{ 
            bgcolor: 'background.paper', 
            borderBottom: 1, 
            borderColor: 'divider',
            mt: isMobile ? '64px' : 0,
          }}>
            <Container maxWidth="xl" sx={{ py: 1 }}>
              <Breadcrumbs 
                aria-label="breadcrumb"
                maxItems={isMobile ? 2 : undefined}
                itemsAfterCollapse={isMobile ? 1 : 2}
                itemsBeforeCollapse={isMobile ? 1 : 1}
              >
                {autoBreadcrumbs.map((crumb, index) => (
                  <div key={index}>
                    {crumb.href && index < autoBreadcrumbs.length - 1 ? (
                      <Link 
                        component={NextLink} 
                        href={crumb.href} 
                        color="inherit"
                        sx={{ 
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                          minHeight: 44,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <Typography 
                        color="text.primary"
                        sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                      >
                        {crumb.label}
                      </Typography>
                    )}
                  </div>
                ))}
              </Breadcrumbs>
            </Container>
          </Box>
        )}

        {/* Page Title - responsive sizing */}
        {title && (
          <Container maxWidth="xl" sx={{ 
            mt: isMobile && !autoBreadcrumbs.length ? '80px' : 3, 
            mb: 2,
            px: { xs: 2, sm: 3 },
          }}>
            <Typography 
              variant={isSmallMobile ? 'h5' : 'h4'} 
              component="h1"
              sx={{
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                fontWeight: 500,
              }}
            >
              {title}
            </Typography>
          </Container>
        )}

        {/* Main Content con padding top per mobile fixed header */}
        <Box component="main" sx={{ 
          flexGrow: 1, 
          bgcolor: 'background.default',
          pt: isMobile && !title && !autoBreadcrumbs.length ? '64px' : 0,
          minHeight: { xs: 'calc(100vh - 64px)', sm: 'auto' },
          overflowX: 'hidden', // Previene overflow orizzontale
          position: 'relative',
        }}>
          <Box sx={{ 
            maxWidth: '100%', 
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch', // Smooth scrolling su iOS
          }}>
            {children}
          </Box>
        </Box>

        {/* Footer - semplificato per mobile */}
        <Box
          component="footer"
          sx={{
            py: { xs: 2, sm: 3 },
            px: 2,
            mt: 'auto',
            backgroundColor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Container maxWidth="xl">
            <Typography 
              variant="body2" 
              color="text.secondary" 
              align="center"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              © 2024 {isSmallMobile ? 'Produzione' : 'Gestione Produzione'}
            </Typography>
          </Container>
        </Box>
        
        {/* Scroll to Top FAB per mobile */}
        <Zoom in={trigger && isMobile}>
          <Fab
            onClick={handleScrollTop}
            color="primary"
            size="small"
            aria-label="scroll back to top"
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: theme.zIndex.fab,
            }}
          >
            <KeyboardArrowUpIcon />
          </Fab>
        </Zoom>
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
    return [{ label: 'Dashboard', href: '/dashboard' }]
  }

  const breadcrumbs: Array<{ label: string; href?: string }> = [{ label: 'Dashboard', href: '/dashboard' }]
  
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
    'settings': 'Impostazioni',
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