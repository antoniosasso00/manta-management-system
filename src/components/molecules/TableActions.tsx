'use client'

import React from 'react'
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Box,
} from '@mui/material'
import {
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'

export interface TableAction<T = any> {
  id: string
  label: string
  icon?: React.ReactNode
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'inherit' | 'default'
  onClick: (item: T) => void
  disabled?: boolean | ((item: T) => boolean)
  hidden?: boolean | ((item: T) => boolean)
}

export interface TableActionsProps<T = any> {
  item: T
  actions?: TableAction<T>[]
  onView?: (item: T) => void
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  variant?: 'inline' | 'menu' | 'auto' // auto = inline su desktop, menu su mobile
  size?: 'small' | 'medium' | 'large'
  hideLabelsOnInline?: boolean
}

export function TableActions<T = any>({
  item,
  actions = [],
  onView,
  onEdit,
  onDelete,
  variant = 'auto',
  size = 'small',
  hideLabelsOnInline = true,
}: TableActionsProps<T>) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  // Costruisce le azioni standard se fornite
  const standardActions: TableAction<T>[] = []
  
  if (onView) {
    standardActions.push({
      id: 'view',
      label: 'Visualizza',
      icon: <ViewIcon />,
      color: 'primary',
      onClick: onView,
    })
  }

  if (onEdit) {
    standardActions.push({
      id: 'edit',
      label: 'Modifica',
      icon: <EditIcon />,
      color: 'primary',
      onClick: onEdit,
    })
  }

  if (onDelete) {
    standardActions.push({
      id: 'delete',
      label: 'Elimina',
      icon: <DeleteIcon />,
      color: 'error',
      onClick: onDelete,
    })
  }

  // Combina azioni standard e custom
  const allActions = [...standardActions, ...actions]

  // Filtra azioni nascoste
  const visibleActions = allActions.filter(action => {
    if (typeof action.hidden === 'function') {
      return !action.hidden(item)
    }
    return !action.hidden
  })

  if (visibleActions.length === 0) {
    return null
  }

  // Determina se mostrare inline o menu
  const shouldShowInline = variant === 'inline' || 
    (variant === 'auto' && typeof window !== 'undefined' && window.innerWidth > 600)

  const handleActionClick = (action: TableAction<T>) => {
    action.onClick(item)
    handleClose()
  }

  const isActionDisabled = (action: TableAction<T>) => {
    if (typeof action.disabled === 'function') {
      return action.disabled(item)
    }
    return action.disabled || false
  }

  // Render inline actions
  if (shouldShowInline) {
    return (
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
        {visibleActions.map(action => (
          <Tooltip key={action.id} title={action.label}>
            <span>
              <IconButton
                size={size}
                color={action.color || 'default'}
                onClick={() => handleActionClick(action)}
                disabled={isActionDisabled(action)}
                sx={{ 
                  p: size === 'small' ? 0.5 : 1,
                }}
              >
                {action.icon || <MoreVertIcon />}
              </IconButton>
            </span>
          </Tooltip>
        ))}
      </Box>
    )
  }

  // Render menu actions
  return (
    <>
      <IconButton
        size={size}
        onClick={handleClick}
        sx={{ 
          p: size === 'small' ? 0.5 : 1,
        }}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {visibleActions.map(action => (
          <MenuItem
            key={action.id}
            onClick={() => handleActionClick(action)}
            disabled={isActionDisabled(action)}
          >
            {action.icon && (
              <ListItemIcon sx={{ color: action.color ? `${action.color}.main` : undefined }}>
                {action.icon}
              </ListItemIcon>
            )}
            <ListItemText primary={action.label} />
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}