'use client'

import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Box,
  Divider,
  IconButton,
  useTheme,
  useMediaQuery,
  Chip,
  Stack,
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'

export interface DetailField {
  label: string
  value: React.ReactNode
  type?: 'text' | 'chip' | 'boolean' | 'date' | 'currency' | 'custom'
  size?: { xs: number; sm?: number; md?: number }
  hideIfEmpty?: boolean
  chipColor?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
}

export interface DetailSection {
  title?: string
  fields: DetailField[]
}

export interface DetailDialogProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  sections?: DetailSection[]
  fields?: DetailField[] // For simple single section dialogs
  actions?: React.ReactNode
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  fullScreen?: boolean
}

export function DetailDialog({
  open,
  onClose,
  title,
  subtitle,
  sections,
  fields,
  actions,
  maxWidth = 'md',
  fullScreen: fullScreenProp,
}: DetailDialogProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const fullScreen = fullScreenProp ?? isMobile

  // Se vengono passati fields direttamente, crea una singola sezione
  const displaySections = sections || (fields ? [{ fields }] : [])

  const renderFieldValue = (field: DetailField): React.ReactNode => {
    if (field.hideIfEmpty && !field.value) {
      return null
    }

    switch (field.type) {
      case 'chip':
        return (
          <Chip
            label={field.value as string}
            color={field.chipColor || 'default'}
            size="small"
          />
        )
      
      case 'boolean':
        return (
          <Typography variant="body2">
            {field.value ? 'Sì' : 'No'}
          </Typography>
        )
      
      case 'date':
        const dateValue = field.value instanceof Date 
          ? field.value 
          : typeof field.value === 'string' 
            ? new Date(field.value) 
            : null
            
        if (dateValue && !isNaN(dateValue.getTime())) {
          return (
            <Typography variant="body2">
              {dateValue.toLocaleDateString('it-IT', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Typography>
          )
        }
        return <Typography variant="body2">-</Typography>
      
      case 'currency':
        return (
          <Typography variant="body2">
            € {Number(field.value).toFixed(2)}
          </Typography>
        )
      
      case 'custom':
        return field.value
      
      default:
        return (
          <Typography variant="body2">
            {field.value || '-'}
          </Typography>
        )
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          maxHeight: fullScreen ? '100%' : '90vh',
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, pr: 6 }}>
        <Box>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={4}>
          {displaySections.map((section, sectionIndex) => (
            <Box key={sectionIndex}>
              {section.title && (
                <>
                  <Typography
                    variant="subtitle1"
                    fontWeight="medium"
                    gutterBottom
                    color="primary"
                  >
                    {section.title}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </>
              )}
              
              <Grid container spacing={3}>
                {section.fields.map((field, fieldIndex) => {
                  if (field.hideIfEmpty && !field.value) {
                    return null
                  }

                  return (
                    <Grid
                      key={fieldIndex}
                      size={field.size || { xs: 12, sm: 6 }}
                    >
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          gutterBottom
                        >
                          {field.label}
                        </Typography>
                        {renderFieldValue(field)}
                      </Box>
                    </Grid>
                  )
                })}
              </Grid>
            </Box>
          ))}
        </Stack>
      </DialogContent>

      {(actions || !fullScreen) && (
        <>
          <Divider />
          <DialogActions sx={{ p: 2 }}>
            {actions || (
              <Button onClick={onClose} variant="contained">
                Chiudi
              </Button>
            )}
          </DialogActions>
        </>
      )}
    </Dialog>
  )
}