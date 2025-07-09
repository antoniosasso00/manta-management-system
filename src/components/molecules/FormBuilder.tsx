'use client'

import React from 'react'
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
  Switch,
  Stack,
  InputAdornment,
  IconButton
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { Controller, Control, FieldErrors } from 'react-hook-form'
import { z } from 'zod'

// Field configuration
export interface FieldConfig {
  name: string
  label: string
  type?: 'text' | 'email' | 'password' | 'number' | 'select' | 'multiselect' | 
         'checkbox' | 'switch' | 'radio' | 'date' | 'time' | 'datetime' | 'textarea'
  placeholder?: string
  helperText?: string
  disabled?: boolean
  required?: boolean
  options?: { value: string | number; label: string }[]
  multiline?: boolean
  rows?: number
  min?: number
  max?: number
  step?: number
  gridSize?: number // 1-12 for responsive grid
  hideLabel?: boolean
  startAdornment?: React.ReactNode
  endAdornment?: React.ReactNode
}

interface FormBuilderProps {
  fields: FieldConfig[]
  control: Control
  errors: FieldErrors
  spacing?: number
  columns?: number
}

export const FormBuilder: React.FC<FormBuilderProps> = ({
  fields,
  control,
  errors,
  spacing = 2,
  columns = 1
}) => {
  const [showPassword, setShowPassword] = React.useState<Record<string, boolean>>({})

  const togglePasswordVisibility = (fieldName: string) => {
    setShowPassword(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }))
  }

  const renderField = (field: FieldConfig) => {
    const error = errors[field.name]
    const errorMessage = typeof error?.message === 'string' ? error.message : undefined

    switch (field.type) {
      case 'select':
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: controllerField }) => (
              <FormControl fullWidth error={!!error} disabled={field.disabled}>
                {!field.hideLabel && <InputLabel>{field.label}</InputLabel>}
                <Select
                  {...controllerField}
                  label={!field.hideLabel ? field.label : undefined}
                >
                  {field.options?.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {(errorMessage || field.helperText) && (
                  <FormHelperText>{errorMessage || field.helperText}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        )

      case 'multiselect':
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: controllerField }) => (
              <FormControl fullWidth error={!!error} disabled={field.disabled}>
                {!field.hideLabel && <InputLabel>{field.label}</InputLabel>}
                <Select
                  {...controllerField}
                  multiple
                  label={!field.hideLabel ? field.label : undefined}
                  value={controllerField.value || []}
                >
                  {field.options?.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {(errorMessage || field.helperText) && (
                  <FormHelperText>{errorMessage || field.helperText}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        )

      case 'checkbox':
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: controllerField }) => (
              <FormControl error={!!error} disabled={field.disabled}>
                <FormControlLabel
                  control={
                    <Checkbox
                      {...controllerField}
                      checked={controllerField.value || false}
                    />
                  }
                  label={field.label}
                />
                {(errorMessage || field.helperText) && (
                  <FormHelperText>{errorMessage || field.helperText}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        )

      case 'switch':
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: controllerField }) => (
              <FormControl error={!!error} disabled={field.disabled}>
                <FormControlLabel
                  control={
                    <Switch
                      {...controllerField}
                      checked={controllerField.value || false}
                    />
                  }
                  label={field.label}
                />
                {(errorMessage || field.helperText) && (
                  <FormHelperText>{errorMessage || field.helperText}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        )

      case 'radio':
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: controllerField }) => (
              <FormControl error={!!error} disabled={field.disabled}>
                {!field.hideLabel && (
                  <InputLabel sx={{ position: 'static', mb: 1 }}>
                    {field.label}
                  </InputLabel>
                )}
                <RadioGroup {...controllerField}>
                  {field.options?.map(option => (
                    <FormControlLabel
                      key={option.value}
                      value={option.value}
                      control={<Radio />}
                      label={option.label}
                    />
                  ))}
                </RadioGroup>
                {(errorMessage || field.helperText) && (
                  <FormHelperText>{errorMessage || field.helperText}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        )

      case 'date':
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: controllerField }) => (
              <DatePicker
                {...controllerField}
                label={!field.hideLabel ? field.label : undefined}
                disabled={field.disabled}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!error,
                    helperText: errorMessage || field.helperText,
                    placeholder: field.placeholder
                  }
                }}
              />
            )}
          />
        )

      case 'time':
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: controllerField }) => (
              <TimePicker
                {...controllerField}
                label={!field.hideLabel ? field.label : undefined}
                disabled={field.disabled}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!error,
                    helperText: errorMessage || field.helperText,
                    placeholder: field.placeholder
                  }
                }}
              />
            )}
          />
        )

      case 'datetime':
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: controllerField }) => (
              <DateTimePicker
                {...controllerField}
                label={!field.hideLabel ? field.label : undefined}
                disabled={field.disabled}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!error,
                    helperText: errorMessage || field.helperText,
                    placeholder: field.placeholder
                  }
                }}
              />
            )}
          />
        )

      case 'password':
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: controllerField }) => (
              <TextField
                {...controllerField}
                value={controllerField.value || ''}
                type={showPassword[field.name] ? 'text' : 'password'}
                label={!field.hideLabel ? field.label : undefined}
                placeholder={field.placeholder}
                fullWidth
                error={!!error}
                helperText={errorMessage || field.helperText}
                disabled={field.disabled}
                required={field.required}
                InputProps={{
                  startAdornment: field.startAdornment,
                  endAdornment: field.endAdornment || (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => togglePasswordVisibility(field.name)}
                        edge="end"
                      >
                        {showPassword[field.name] ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            )}
          />
        )

      case 'textarea':
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: controllerField }) => (
              <TextField
                {...controllerField}
                value={controllerField.value || ''}
                label={!field.hideLabel ? field.label : undefined}
                placeholder={field.placeholder}
                fullWidth
                multiline
                rows={field.rows || 4}
                error={!!error}
                helperText={errorMessage || field.helperText}
                disabled={field.disabled}
                required={field.required}
                InputProps={{
                  startAdornment: field.startAdornment,
                  endAdornment: field.endAdornment
                }}
              />
            )}
          />
        )

      default:
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: controllerField }) => (
              <TextField
                {...controllerField}
                value={controllerField.value || ''}
                type={field.type || 'text'}
                label={!field.hideLabel ? field.label : undefined}
                placeholder={field.placeholder}
                fullWidth
                error={!!error}
                helperText={errorMessage || field.helperText}
                disabled={field.disabled}
                required={field.required}
                multiline={field.multiline}
                rows={field.rows}
                InputProps={{
                  startAdornment: field.startAdornment,
                  endAdornment: field.endAdornment,
                  inputProps: {
                    min: field.min,
                    max: field.max,
                    step: field.step
                  }
                }}
              />
            )}
          />
        )
    }
  }

  // Render fields in grid layout
  if (columns > 1) {
    const gridClass = columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 
                     columns === 3 ? 'grid-cols-1 md:grid-cols-3' :
                     columns === 4 ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1'
    
    return (
      <Box className={`grid ${gridClass} gap-${spacing * 2}`}>
        {fields.map(field => (
          <Box key={field.name} className={field.gridSize ? `md:col-span-${field.gridSize}` : ''}>
            {renderField(field)}
          </Box>
        ))}
      </Box>
    )
  }

  // Render fields in stack layout
  return (
    <Stack spacing={spacing}>
      {fields.map(field => (
        <Box key={field.name}>
          {renderField(field)}
        </Box>
      ))}
    </Stack>
  )
}

// Utility to generate field configs from Zod schema
export function generateFieldsFromZodSchema<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  customConfigs?: Partial<Record<string, Partial<FieldConfig>>>
): FieldConfig[] {
  const shape = schema.shape
  const fields: FieldConfig[] = []

  Object.entries(shape).forEach(([key, value]) => {
    const customConfig = customConfigs?.[key] || {}
    
    const fieldConfig: FieldConfig = {
      name: key,
      label: customConfig.label || key.charAt(0).toUpperCase() + key.slice(1),
      ...customConfig
    }

    // Determine field type from Zod schema
    if (value instanceof z.ZodString) {
      if (key.includes('email')) fieldConfig.type = 'email'
      else if (key.includes('password')) fieldConfig.type = 'password'
      else fieldConfig.type = 'text'
    } else if (value instanceof z.ZodNumber) {
      fieldConfig.type = 'number'
    } else if (value instanceof z.ZodBoolean) {
      fieldConfig.type = 'checkbox'
    } else if (value instanceof z.ZodDate) {
      fieldConfig.type = 'date'
    } else if (value instanceof z.ZodEnum) {
      fieldConfig.type = 'select'
      fieldConfig.options = value._def.values.map((v: string) => ({
        value: v,
        label: v
      }))
    } else if (value instanceof z.ZodArray) {
      fieldConfig.type = 'multiselect'
    }

    // Check if field is required
    if (!(value instanceof z.ZodOptional) && !(value instanceof z.ZodNullable)) {
      fieldConfig.required = true
    }

    fields.push(fieldConfig)
  })

  return fields
}