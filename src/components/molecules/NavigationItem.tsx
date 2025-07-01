'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import NextLink from 'next/link'
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  List,
  Divider,
  Tooltip,
} from '@mui/material'
import { ExpandLess, ExpandMore } from '@mui/icons-material'
import type { NavigationItem as NavigationItemType } from '@/config/navigationConfig'

interface NavigationItemProps {
  item: NavigationItemType
  level?: number
  collapsed?: boolean
  onItemClick?: () => void
}

export function NavigationItem({ 
  item, 
  level = 0, 
  collapsed = false,
  onItemClick 
}: NavigationItemProps) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(
    // Auto-expand se il path corrente è dentro questo gruppo
    item.children?.some(child => pathname.startsWith(child.href)) || false
  )

  const isActive = pathname === item.href || 
    (item.children && item.children.some(child => pathname.startsWith(child.href)))
  
  const hasChildren = item.children && item.children.length > 0
  const IconComponent = item.icon

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (hasChildren) {
      setExpanded(!expanded)
    }
  }

  const handleItemClick = () => {
    if (onItemClick) {
      onItemClick()
    }
  }

  // Padding basato sul livello di nesting
  const paddingLeft = 16 + (level * 16)

  const listItemContent = (
    <>
      <ListItemIcon
        sx={{
          minWidth: collapsed ? 0 : 40,
          justifyContent: 'center',
          color: isActive ? 'primary.main' : 'inherit',
        }}
      >
        <IconComponent />
      </ListItemIcon>
      
      {!collapsed && (
        <>
          <ListItemText
            primary={item.label}
            sx={{
              '& .MuiListItemText-primary': {
                fontSize: level > 0 ? '0.875rem' : '1rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'primary.main' : 'inherit',
              },
            }}
          />
          
          {hasChildren && (
            <ListItemIcon
              sx={{ 
                minWidth: 'auto',
                justifyContent: 'center',
                ml: 1,
              }}
              onClick={handleToggleExpand}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </ListItemIcon>
          )}
        </>
      )}
    </>
  )

  const listItem = (
    <ListItem
      disablePadding
      sx={{
        display: 'block',
      }}
    >
      {hasChildren ? (
        // Item con figli - comportamento toggle
        <ListItemButton
          onClick={handleToggleExpand}
          sx={{
            minHeight: 44, // Mobile-first touch target
            pl: `${paddingLeft}px`,
            backgroundColor: isActive ? 'action.selected' : 'transparent',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          {listItemContent}
        </ListItemButton>
      ) : (
        // Item senza figli - link normale
        <ListItemButton
          component={NextLink}
          href={item.href}
          onClick={handleItemClick}
          sx={{
            minHeight: 44, // Mobile-first touch target
            pl: `${paddingLeft}px`,
            backgroundColor: isActive ? 'action.selected' : 'transparent',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          {listItemContent}
        </ListItemButton>
      )}
    </ListItem>
  )

  return (
    <>
      {/* Divider se richiesto */}
      {item.divider && level === 0 && (
        <Divider sx={{ my: 1, mx: 2 }} />
      )}
      
      {/* Item principale */}
      {collapsed && item.label ? (
        <Tooltip title={item.label} placement="right">
          {listItem}
        </Tooltip>
      ) : (
        listItem
      )}

      {/* Children collassabili */}
      {hasChildren && !collapsed && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <List disablePadding>
            {item.children!.map((child) => (
              <NavigationItem
                key={child.id}
                item={child}
                level={level + 1}
                collapsed={collapsed}
                onItemClick={onItemClick}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  )
}

// Variante per mobile drawer con comportamento diverso
export function MobileNavigationItem({ 
  item, 
  level = 0, 
  onItemClick 
}: Omit<NavigationItemProps, 'collapsed'>) {
  return (
    <NavigationItem
      item={item}
      level={level}
      collapsed={false}
      onItemClick={onItemClick}
    />
  )
}