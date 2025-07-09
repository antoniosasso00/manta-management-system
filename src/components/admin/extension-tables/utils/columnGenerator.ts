import React from 'react'
import { GridColDef } from '@mui/x-data-grid'
import { Box, Typography, Chip } from '@mui/material'
import { ExtensionField } from '../types'

export const generateColumns = (fields: ExtensionField[]): GridColDef[] => {
  const columns: GridColDef[] = []

  // Colonna Part Number (sempre presente)
  columns.push({
    field: 'partNumber',
    headerName: 'Part Number',
    width: 150,
    valueGetter: (value, row) => row.part?.partNumber || '',
    renderCell: (params) => React.createElement(Chip, {
      label: params.value,
      size: 'small',
      variant: 'outlined'
    })
  })

  // Colonna Descrizione Part (sempre presente)
  columns.push({
    field: 'description',
    headerName: 'Descrizione',
    width: 250,
    valueGetter: (value, row) => row.part?.description || ''
  })

  // Genera colonne per ogni campo della configurazione
  fields.forEach(field => {
    if (field.name === 'partId') return // Skip partId, già gestito sopra

    const column: GridColDef = {
      field: field.name,
      headerName: field.label,
      width: getColumnWidth(field),
      align: getColumnAlign(field),
      headerAlign: getColumnAlign(field),
      renderCell: (params) => renderCellContent(params, field)
    }

    // Gestione speciale per campi con relazioni
    if (field.name === 'curingCycleId') {
      column.valueGetter = (value, row) => {
        const cycle = row.curingCycle
        return cycle ? `${cycle.code} - ${cycle.name}` : ''
      }
      column.renderCell = (params) => {
        const cycle = params.row.curingCycle
        if (!cycle) return '-'
        return React.createElement(Box, null,
          React.createElement(Typography, { variant: 'body2' }, cycle.code),
          React.createElement(Typography, { variant: 'caption', color: 'textSecondary' }, cycle.name)
        )
      }
    }

    columns.push(column)
  })

  return columns
}

const getColumnWidth = (field: ExtensionField): number => {
  switch (field.type) {
    case 'boolean':
      return 100
    case 'number':
      return field.name.includes('Time') ? 120 : 100
    case 'multiline':
      return 200
    case 'select':
    case 'autocomplete':
      return 150
    default:
      return 130
  }
}

const getColumnAlign = (field: ExtensionField): 'left' | 'center' | 'right' => {
  switch (field.type) {
    case 'number':
    case 'boolean':
      return 'center'
    default:
      return 'left'
  }
}

const renderCellContent = (params: any, field: ExtensionField) => {
  const value = params.value

  if (value === null || value === undefined || value === '') {
    return '-'
  }

  switch (field.type) {
    case 'boolean':
      return value ? 'Sì' : 'No'
    
    case 'number':
      if (field.unit) {
        return `${value} ${field.unit}`
      }
      return value
    
    case 'select':
      const option = field.options?.find(opt => opt.value === value)
      return option ? option.label : value
    
    case 'multiline':
      return value.length > 50 ? `${value.substring(0, 50)}...` : value
    
    default:
      return value
  }
}