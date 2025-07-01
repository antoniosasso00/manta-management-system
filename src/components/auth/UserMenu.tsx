'use client'

import { useState } from 'react'
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
} from '@mui/material'
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@prisma/client'

export function UserMenu() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const { user, isAdmin } = useAuth()
  const router = useRouter()

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

  if (!user) {
    return null
  }

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{ ml: 2 }}
        aria-controls={anchorEl ? 'user-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={anchorEl ? 'true' : undefined}
      >
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
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
            label={getRoleLabel(user.role)} 
            color={getRoleColor(user.role)}
            size="small"
          />
        </MenuItem>

        <Divider />

        {/* Profile */}
        <MenuItem onClick={() => handleMenuAction(() => router.push('/profile'))}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profilo</ListItemText>
        </MenuItem>

        {/* Change Password */}
        <MenuItem onClick={() => handleMenuAction(() => router.push('/change-password'))}>
          <ListItemIcon>
            <LockIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Cambia Password</ListItemText>
        </MenuItem>

        {/* Admin Panel */}
        {isAdmin && [
          <Divider key="admin-divider" />,
          <MenuItem key="admin-menu" onClick={() => handleMenuAction(() => router.push('/admin/users'))}>
            <ListItemIcon>
              <AdminIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Gestione Utenti</ListItemText>
          </MenuItem>
        ]}

        <Divider />

        {/* Logout */}
        <MenuItem 
          onClick={() => handleMenuAction(() => signOut({ callbackUrl: '/login' }))}
          sx={{ color: 'error.main' }}
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