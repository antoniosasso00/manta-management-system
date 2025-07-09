'use client'

import React from 'react'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Stack,
  SelectChangeEvent
} from '@mui/material'
import { Close as CloseIcon, FilterList as FilterIcon } from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { it } from 'date-fns/locale'
import type { DateValidationError, PickerChangeHandlerContext } from '@mui/x-date-pickers/models'

export interface FilterConfig {
  id: string
  label: string
  type: 'select' | 'multiselect' | 'text' | 'date' | 'daterange'
  options?: { value: string; label: string }[]
  placeholder?: string
}

export interface FilterValues {
  [key: string]: string | number | boolean | Date | string[] | null
}

interface FilterPanelProps {
  open: boolean
  onClose: () => void
  filters: FilterConfig[]
  values: FilterValues
  onChange: (values: FilterValues) => void
  onApply: () => void
  onReset: () => void
  title?: string
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  open,
  onClose,
  filters,
  values,
  onChange,
  onApply,
  onReset,
  title = 'Filtri'
}) => {
  const handleChange = (filterId: string, value: string | number | boolean | Date | string[] | null) => {
    onChange({
      ...values,
      [filterId]: value
    })
  }

  const handleSelectChange = (filterId: string) => (event: SelectChangeEvent<string | string[]>) => {
    handleChange(filterId, event.target.value)
  }

  const handleTextChange = (filterId: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(filterId, event.target.value)
  }

  const handleDateChange = (filterId: string) => (value: any, context: PickerChangeHandlerContext<DateValidationError>) => {
    handleChange(filterId, value)
  }

  const activeFiltersCount = Object.values(values).filter(v => 
    v !== undefined && v !== null && v !== '' && 
    (!Array.isArray(v) || v.length > 0)
  ).length

  const renderFilter = (filter: FilterConfig) => {
    switch (filter.type) {
      case 'select':
        return (
          <FormControl fullWidth key={filter.id}>
            <InputLabel>{filter.label}</InputLabel>
            <Select
              value={(values[filter.id] as string) || ''}
              label={filter.label}
              onChange={handleSelectChange(filter.id)}
            >
              <MenuItem value="">
                <em>Tutti</em>
              </MenuItem>
              {filter.options?.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )

      case 'multiselect':
        return (
          <FormControl fullWidth key={filter.id}>
            <InputLabel>{filter.label}</InputLabel>
            <Select
              multiple
              value={(values[filter.id] as string[]) || []}
              label={filter.label}
              onChange={handleSelectChange(filter.id)}
              renderValue={(selected: string[]) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map(value => {
                    const option = filter.options?.find(o => o.value === value)
                    return (
                      <Chip 
                        key={value} 
                        label={option?.label || value} 
                        size="small"
                      />
                    )
                  })}
                </Box>
              )}
            >
              {filter.options?.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )

      case 'text':
        return (
          <TextField
            key={filter.id}
            fullWidth
            label={filter.label}
            placeholder={filter.placeholder}
            value={(values[filter.id] as string) || ''}
            onChange={handleTextChange(filter.id)}
          />
        )

      case 'date':
        return (
          <LocalizationProvider 
            key={filter.id} 
            dateAdapter={AdapterDateFns} 
            adapterLocale={it}
          >
            <DatePicker
              label={filter.label}
              value={(values[filter.id] as Date) || null}
              onChange={handleDateChange(filter.id)}
              slotProps={{
                textField: { fullWidth: true }
              }}
            />
          </LocalizationProvider>
        )

      case 'daterange':
        return (
          <LocalizationProvider 
            key={filter.id} 
            dateAdapter={AdapterDateFns} 
            adapterLocale={it}
          >
            <Stack spacing={2}>
              <DatePicker
                label={`${filter.label} - Da`}
                value={(values[`${filter.id}_from`] as Date) || null}
                onChange={handleDateChange(`${filter.id}_from`)}
                slotProps={{
                  textField: { fullWidth: true }
                }}
              />
              <DatePicker
                label={`${filter.label} - A`}
                value={(values[`${filter.id}_to`] as Date) || null}
                onChange={handleDateChange(`${filter.id}_to`)}
                slotProps={{
                  textField: { fullWidth: true }
                }}
              />
            </Stack>
          </LocalizationProvider>
        )

      default:
        return null
    }
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 400 },
          p: 3
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FilterIcon sx={{ mr: 1 }} />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {title}
          {activeFiltersCount > 0 && (
            <Chip 
              label={activeFiltersCount} 
              size="small" 
              color="primary"
              sx={{ ml: 1 }}
            />
          )}
        </Typography>
        <IconButton onClick={onClose} edge="end">
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Stack spacing={3}>
        {filters.map(filter => renderFilter(filter))}
      </Stack>

      <Box 
        sx={{ 
          mt: 4, 
          display: 'flex', 
          gap: 2,
          position: 'sticky',
          bottom: 0,
          bgcolor: 'background.paper',
          pt: 2
        }}
      >
        <Button
          fullWidth
          variant="outlined"
          onClick={() => {
            onReset()
            onClose()
          }}
        >
          Reimposta
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={() => {
            onApply()
            onClose()
          }}
        >
          Applica Filtri
        </Button>
      </Box>
    </Drawer>
  )
}