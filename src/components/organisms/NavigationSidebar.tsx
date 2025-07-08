'use client'

import { useMemo, useState, useCallback, memo, useRef, useEffect } from 'react'
import {
  Drawer,
  List,
  Box,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Avatar,
  Chip,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  SwipeableDrawer,
  Divider,
} from '@mui/material'
import { useSwipeable } from 'react-swipeable'
import {
  ChevronLeft,
  ChevronRight,
  AccountCircle,
  PersonSearch,
  Close as CloseIcon,
} from '@mui/icons-material'
import { NavigationItem } from '@/components/molecules/NavigationItem'
import { Logo } from '@/components/atoms/Logo'
import { getNavigationForUser } from '@/config/navigationConfig'
import { useAuth } from '@/hooks/useAuth'
import { ROLE_DISPLAY_NAMES, USER_ROLES } from '@/utils/constants'
import type { UserRole } from '@/utils/constants'

interface NavigationSidebarProps {
  open: boolean
  onClose: () => void
  collapsed?: boolean
  onToggleCollapsed?: () => void
  variant?: 'temporary' | 'persistent' | 'permanent'
}

const SIDEBAR_WIDTH = 280
const SIDEBAR_COLLAPSED_WIDTH = 64

const NavigationSidebarComponent = memo(function NavigationSidebar({
  open,
  onClose,
  collapsed = false,
  onToggleCollapsed,
  variant = 'permanent',
}: NavigationSidebarProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), {
    noSsr: true // Evita hydration mismatch
  })
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const { user, isAuthenticated } = useAuth()
  
  // Callback per close ottimizzato
  const handleClose = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10) // Feedback per chiusura
    }
    onClose()
  }, [onClose])

  // Swipe handlers per mobile con gesture migliorati
  const swipeHandlers = useSwipeable({
    onSwipedLeft: (eventData) => {
      if (isMobile && open) {
        // Chiudi solo se swipe inizia da sidebar o se sidebar è aperta
        handleClose()
      }
    },
    onSwipedRight: () => {}, // Previeni swipe accidentale dal bordo
    onSwipeStart: (eventData) => {
      // Haptic feedback leggero all'inizio del swipe
      if ('vibrate' in navigator && eventData.initial[0] > window.innerWidth * 0.7) {
        navigator.vibrate(10)
      }
    },
    onSwiping: (eventData) => {
      // Feedback visivo durante lo swipe (opzionale)
      const swipeProgress = Math.abs(eventData.deltaX) / (window.innerWidth * 0.3)
      if (swipeProgress > 0.5 && 'vibrate' in navigator) {
        navigator.vibrate(5) // Feedback quando swipe è abbastanza lungo
      }
    },
    trackMouse: false,
    trackTouch: true,
    delta: 30, // Ridotto per più sensibilità
    preventScrollOnSwipe: true,
    touchEventOptions: { passive: false }, // Previeni scroll durante swipe
  })
  
  // Stato per la selezione del ruolo (solo per admin)
  const [selectedRole, setSelectedRole] = useState<string>('')
  
  // Determina il ruolo da usare per la navigazione
  const effectiveRole = useMemo(() => {
    if (user?.role === USER_ROLES.ADMIN && selectedRole) {
      return selectedRole
    }
    return user?.role || ''
  }, [user?.role, selectedRole])

  // Ottieni la navigazione specifica per l'utente corrente
  const navigation = useMemo(() => {
    if (!user) return []
    
    // Se l'admin ha selezionato un ruolo, usa quello
    if (user.role === USER_ROLES.ADMIN && selectedRole) {
      return getNavigationForUser(selectedRole, undefined)
    }
    
    return getNavigationForUser(
      user.role,
      user.departmentRole || undefined
    )
  }, [user, selectedRole])

  const currentWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Auto-focus management per accessibility
  useEffect(() => {
    if (isMobile && open && sidebarRef.current) {
      // Focus il primo elemento focalizzabile quando la sidebar si apre
      const firstFocusable = sidebarRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement
      
      if (firstFocusable) {
        setTimeout(() => firstFocusable.focus(), 200) // Delay per animazione
      }
    }
  }, [isMobile, open])

  // Gestione ESC key per chiudere sidebar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMobile && open) {
        handleClose()
      }
    }

    if (isMobile && open) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMobile, open, handleClose])

  if (!isAuthenticated || !user) {
    return null
  }

  const sidebarContent = (
    <Box
      ref={sidebarRef}
      sx={{
        width: currentWidth,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.paper',
        borderRight: `1px solid ${theme.palette.divider}`,
        // Safe area support per iPhone con notch
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
      }}
      role="navigation"
      aria-label="Menu di navigazione principale"
    >
      {/* Logo Section con close button per mobile */}
      <Box
        sx={{
          p: collapsed ? 1 : 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight: { xs: 64, sm: 56 },
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Logo 
          size={collapsed || isSmallScreen ? 'small' : 'medium'} 
          showText={!collapsed && !isSmallScreen} 
          variant={collapsed || isSmallScreen ? 'icon' : 'full'}
        />
        {isMobile && !collapsed && (
          <IconButton 
            onClick={onClose}
            sx={{ 
              width: 44,
              height: 44,
            }}
            aria-label="chiudi menu"
          >
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {/* Header con info utente - ottimizzato mobile */}
      <Box
        sx={{
          p: collapsed ? 1 : { xs: 1.5, sm: 2 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight: { xs: 56, sm: 64 },
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <Avatar
              sx={{
                width: { xs: 36, sm: 32 },
                height: { xs: 36, sm: 32 },
                bgcolor: 'primary.main',
                fontSize: { xs: '1rem', sm: '0.875rem' },
              }}
            >
              {user.name?.charAt(0).toUpperCase() || <AccountCircle />}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.name || user.email}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {ROLE_DISPLAY_NAMES[user.role]}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Toggle button per desktop */}
        {!isMobile && onToggleCollapsed && (
          <IconButton
            onClick={onToggleCollapsed}
            size="small"
            sx={{
              ml: collapsed ? 0 : 1,
            }}
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        )}
      </Box>

      {/* Info reparto se presente - nascosto su mobile piccoli */}
      {!collapsed && !isSmallScreen && user.departmentRole && user.role !== USER_ROLES.ADMIN && (
        <Box sx={{ px: 2, py: 1 }}>
          <Chip
            label={ROLE_DISPLAY_NAMES[user.departmentRole]}
            size="small"
            variant="outlined"
            color="primary"
            sx={{ fontSize: '0.75rem' }}
          />
        </Box>
      )}
      
      {/* Dropdown Impersona Ruolo per Admin - semplificato mobile */}
      {!collapsed && user.role === USER_ROLES.ADMIN && (
        <Box sx={{ px: { xs: 1.5, sm: 2 }, py: 1 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="role-select-label">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <PersonSearch sx={{ fontSize: { xs: 16, sm: 18 } }} />
                <span style={{ fontSize: isSmallScreen ? '0.875rem' : '1rem' }}>Impersona</span>
              </Box>
            </InputLabel>
            <Select
              labelId="role-select-label"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              label="Impersona"
              sx={{
                minHeight: 44, // Touch target minimo
              }}
            >
              <MenuItem value="">
                <em>Vista Admin (Default)</em>
              </MenuItem>
              <MenuItem value={USER_ROLES.SUPERVISOR}>
                {ROLE_DISPLAY_NAMES[USER_ROLES.SUPERVISOR]}
              </MenuItem>
              <MenuItem value={USER_ROLES.OPERATOR}>
                {ROLE_DISPLAY_NAMES[USER_ROLES.OPERATOR]}
              </MenuItem>
            </Select>
          </FormControl>
          {selectedRole && (
            <Chip
              label={`Viewing as: ${ROLE_DISPLAY_NAMES[selectedRole as keyof typeof ROLE_DISPLAY_NAMES]}`}
              size="small"
              color="warning"
              variant="filled"
              sx={{ mt: 1, fontSize: '0.75rem' }}
              onDelete={() => setSelectedRole('')}
            />
          )}
        </Box>
      )}

      {/* Navigazione principale con scroll ottimizzato */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch', // Smooth scrolling iOS
        // Prevenzione pull-to-refresh
        touchAction: 'pan-y',
        // Scroll elastico iOS
        '&::-webkit-scrollbar': {
          width: 4,
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: theme.palette.divider,
          borderRadius: 2,
          '&:hover': {
            background: theme.palette.action.hover,
          },
        },
        // Momentum scrolling migliorato
        scrollBehavior: 'smooth',
      }}>
        <List disablePadding sx={{ py: { xs: 0.5, sm: 1 } }}>
          {navigation.map((item) => (
            <NavigationItem
              key={item.id}
              item={item}
              collapsed={collapsed}
              onItemClick={isMobile ? handleClose : undefined}
            />
          ))}
        </List>
      </Box>

      {/* Footer con versione - nascosto su mobile piccoli */}
      {!collapsed && !isSmallScreen && (
        <Box
          sx={{
            p: { xs: 1, sm: 2 },
            borderTop: `1px solid ${theme.palette.divider}`,
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            MES v1.0
          </Typography>
        </Box>
      )}
    </Box>
  )

  // Mobile: usa SwipeableDrawer con gesture support e backdrop blur
  if (isMobile) {
    return (
      <SwipeableDrawer
        variant="temporary"
        open={open}
        onClose={handleClose}
        onOpen={() => {}}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
          BackdropProps: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)', // Safari support
            },
          },
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '85%', sm: SIDEBAR_WIDTH },
            maxWidth: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            boxShadow: '8px 0 32px rgba(0, 0, 0, 0.24)',
            borderRadius: { xs: '0 16px 16px 0', sm: 0 },
            transition: theme.transitions.create(['transform', 'box-shadow'], {
              easing: theme.transitions.easing.easeInOut,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
          '& .MuiBackdrop-root': {
            transition: theme.transitions.create('opacity', {
              easing: theme.transitions.easing.easeInOut,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
        {...swipeHandlers}
      >
        {sidebarContent}
      </SwipeableDrawer>
    )
  }

  // Desktop: usa variante specificata
  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={handleClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: currentWidth,
          boxSizing: 'border-box',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
        },
      }}
    >
      {sidebarContent}
    </Drawer>
  )
})

export const NavigationSidebar = NavigationSidebarComponent

// Hook per gestire lo stato della sidebar
export function useSidebar() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), {
    noSsr: true // Evita hydration mismatch
  })
  
  return {
    isMobile,
    defaultOpen: !isMobile,
    defaultCollapsed: false,
    sidebarWidth: SIDEBAR_WIDTH,
    sidebarCollapsedWidth: SIDEBAR_COLLAPSED_WIDTH,
  }
}