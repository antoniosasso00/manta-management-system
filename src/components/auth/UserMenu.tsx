'use client'

import { useState, useEffect } from 'react'
import {
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  BrightnessAuto as AutoModeIcon,
} from '@mui/icons-material'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useTheme as useThemeContext } from '@/contexts/ThemeContext'
import { UserRole } from '@prisma/client'

export function UserMenu() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const theme = useTheme()
  const { mode: themeMode, setTheme: setThemeMode } = useThemeContext()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [isImpersonating, setIsImpersonating] = useState(false)
  
  // Controlla se c'è un token di impersonificazione
  useEffect(() => {
    const checkImpersonation = async () => {
      const response = await fetch('/api/admin/impersonate/check')
      if (response.ok) {
        const data = await response.json()
        setIsImpersonating(data.isImpersonating)
      }
    }
    checkImpersonation()
  }, [])

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleMenuAction = (action: () => void) => {
    handleClose()
    action()
  }

  const getRoleColor = (role: UserRole): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (role) {
      case UserRole.ADMIN:
        return 'error'
      case UserRole.SUPERVISOR:
        return 'warning'
      case UserRole.OPERATOR:
        return 'primary'
      default:
        return 'default'
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Admin'
      case UserRole.SUPERVISOR:
        return 'Supervisore'
      case UserRole.OPERATOR:
        return 'Operatore'
      default:
        return role
    }
  }
  
  const handleStopImpersonation = async () => {
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'DELETE'
      })
      if (response.ok) {
        window.location.href = '/dashboard'
      }
    } catch (error) {
      console.error('Error stopping impersonation:', error)
    }
  }

  const handleThemeToggle = () => {
    const nextTheme = themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'auto' : 'light'
    setThemeMode(nextTheme)
  }

  const getThemeIcon = () => {
    switch (themeMode) {
      case 'light':
        return <LightModeIcon fontSize="small" />
      case 'dark':
        return <DarkModeIcon fontSize="small" />
      case 'auto':
        return <AutoModeIcon fontSize="small" />
      default:
        return <LightModeIcon fontSize="small" />
    }
  }

  const getThemeLabel = () => {
    switch (themeMode) {
      case 'light':
        return 'Tema: Chiaro'
      case 'dark':
        return 'Tema: Scuro'
      case 'auto':
        return 'Tema: Automatico'
      default:
        return 'Tema: Chiaro'
    }
  }

  if (!user) {
    return null
  }

  return (
    <>
      <IconButton
        onClick={handleClick}
        size={isMobile ? "medium" : "small"}
        sx={{ 
          ml: { xs: 1, sm: 2 },
          width: { xs: 44, sm: 40 },
          height: { xs: 44, sm: 40 },
        }}
        aria-controls={anchorEl ? 'user-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={anchorEl ? 'true' : undefined}
      >
        <Avatar sx={{ 
          width: { xs: 36, sm: 32 }, 
          height: { xs: 36, sm: 32 }, 
          bgcolor: 'primary.main',
          fontSize: { xs: '1rem', sm: '0.875rem' },
        }}>
          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
        </Avatar>
      </IconButton>

      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            minWidth: 200,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* User Info Header */}
        <MenuItem disabled sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
          <Typography variant="subtitle2" noWrap>
            {user.name || 'Utente'}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 1 }}>
            {user.email}
          </Typography>
          <Chip 
            label={getRoleLabel(user.role) + (isImpersonating ? ' (Test)' : '')} 
            color={getRoleColor(user.role)}
            size="small"
          />
        </MenuItem>

        <Divider />

        {/* Profile */}
        <MenuItem 
          onClick={() => handleMenuAction(() => router.push('/profile'))}
          sx={{ minHeight: { xs: 48, sm: 'auto' } }}
        >
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profilo</ListItemText>
        </MenuItem>

        {/* Change Password */}
        <MenuItem 
          onClick={() => handleMenuAction(() => router.push('/change-password'))}
          sx={{ minHeight: { xs: 48, sm: 'auto' } }}
        >
          <ListItemIcon>
            <LockIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Cambia Password</ListItemText>
        </MenuItem>

        {/* Settings */}
        <MenuItem 
          onClick={() => handleMenuAction(() => router.push('/settings'))}
          sx={{ minHeight: { xs: 48, sm: 'auto' } }}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Impostazioni</ListItemText>
        </MenuItem>

        {/* Theme Toggle */}
        <MenuItem 
          onClick={() => handleMenuAction(handleThemeToggle)}
          sx={{ minHeight: { xs: 48, sm: 'auto' } }}
        >
          <ListItemIcon>
            {getThemeIcon()}
          </ListItemIcon>
          <ListItemText>{getThemeLabel()}</ListItemText>
        </MenuItem>

        {/* Admin Panel */}
        {isAdmin && [
          <Divider key="admin-divider" />,
          <MenuItem 
            key="admin-menu" 
            onClick={() => handleMenuAction(() => router.push('/admin/users'))}
            sx={{ minHeight: { xs: 48, sm: 'auto' } }}
          >
            <ListItemIcon>
              <AdminIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Gestione Utenti</ListItemText>
          </MenuItem>
        ]}

        <Divider />
        
        {/* Stop Impersonation */}
        {isImpersonating && [
          <MenuItem 
            key="stop-impersonation"
            onClick={() => handleMenuAction(handleStopImpersonation)}
            sx={{ 
              color: 'warning.main',
              minHeight: { xs: 48, sm: 'auto' },
              bgcolor: 'warning.light',
              '&:hover': {
                bgcolor: 'warning.light'
              }
            }}
          >
            <ListItemIcon>
              <CloseIcon fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText>Termina Impersonificazione</ListItemText>
          </MenuItem>,
          <Divider key="impersonation-divider" />
        ]}

        {/* Logout */}
        <MenuItem 
          onClick={() => handleMenuAction(() => signOut({ callbackUrl: '/login' }))}
          sx={{ 
            color: 'error.main',
            minHeight: { xs: 48, sm: 'auto' }
          }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}