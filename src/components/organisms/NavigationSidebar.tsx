'use client'

import { useMemo, useState } from 'react'
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
} from '@mui/material'
import {
  ChevronLeft,
  ChevronRight,
  AccountCircle,
  PersonSearch,
} from '@mui/icons-material'
import { NavigationItem } from '@/components/molecules/NavigationItem'
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

export function NavigationSidebar({
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
  const { user, isAuthenticated } = useAuth()
  
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

  if (!isAuthenticated || !user) {
    return null
  }

  const sidebarContent = (
    <Box
      sx={{
        width: currentWidth,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.paper',
        borderRight: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Header con info utente */}
      <Box
        sx={{
          p: collapsed ? 1 : 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight: 64,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: 'primary.main',
                fontSize: '0.875rem',
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

      {/* Info reparto se presente */}
      {!collapsed && user.departmentRole && user.role !== USER_ROLES.ADMIN && (
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
      
      {/* Dropdown Impersona Ruolo per Admin */}
      {!collapsed && user.role === USER_ROLES.ADMIN && (
        <Box sx={{ px: 2, py: 1 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="role-select-label">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <PersonSearch sx={{ fontSize: 18 }} />
                <span>Impersona Ruolo</span>
              </Box>
            </InputLabel>
            <Select
              labelId="role-select-label"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              label="Impersona Ruolo"
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
              label={`Viewing as: ${ROLE_DISPLAY_NAMES[selectedRole]}`}
              size="small"
              color="warning"
              variant="filled"
              sx={{ mt: 1, fontSize: '0.75rem' }}
              onDelete={() => setSelectedRole('')}
            />
          )}
        </Box>
      )}

      {/* Navigazione principale */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List disablePadding sx={{ py: 1 }}>
          {navigation.map((item) => (
            <NavigationItem
              key={item.id}
              item={item}
              collapsed={collapsed}
              onItemClick={isMobile ? onClose : undefined}
            />
          ))}
        </List>
      </Box>

      {/* Footer con versione */}
      {!collapsed && (
        <Box
          sx={{
            p: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            MES Aerospazio v1.0
          </Typography>
        </Box>
      )}
    </Box>
  )

  // Mobile: usa sempre drawer temporaneo
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    )
  }

  // Desktop: usa variante specificata
  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
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
}

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