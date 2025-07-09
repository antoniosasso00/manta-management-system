'use client'

import React from 'react'
import { Box, Button, ButtonGroup, TextField, InputAdornment } from '@mui/material'
import { 
  Add as AddIcon,
  Search as SearchIcon,
  FileDownload as ExportIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'

interface CRUDToolbarProps {
  onAdd?: () => void
  onSearch?: (query: string) => void
  onExport?: () => void
  onFilter?: () => void
  onRefresh?: () => void
  searchPlaceholder?: string
  searchValue?: string
  showAdd?: boolean
  showSearch?: boolean
  showExport?: boolean
  showFilter?: boolean
  showRefresh?: boolean
  addLabel?: string
  exportLabel?: string
  disabled?: boolean
}

export const CRUDToolbar: React.FC<CRUDToolbarProps> = ({
  onAdd,
  onSearch,
  onExport,
  onFilter,
  onRefresh,
  searchPlaceholder = 'Cerca...',
  searchValue = '',
  showAdd = true,
  showSearch = true,
  showExport = true,
  showFilter = true,
  showRefresh = true,
  addLabel = 'Nuovo',
  exportLabel = 'Esporta',
  disabled = false
}) => {
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    onSearch?.(value)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        gap: 2,
        flexWrap: 'wrap'
      }}
    >
      {/* Search Field */}
      {showSearch && (
        <TextField
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={handleSearchChange}
          size="small"
          disabled={disabled}
          sx={{ 
            minWidth: { xs: '100%', sm: 300 },
            flexGrow: { xs: 1, sm: 0 }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      )}

      {/* Action Buttons */}
      <ButtonGroup 
        variant="contained" 
        size="medium"
        disabled={disabled}
        sx={{ 
          flexWrap: 'wrap',
          '& > *': { 
            minHeight: 44 // Mobile-friendly touch target
          }
        }}
      >
        {showAdd && onAdd && (
          <Button
            onClick={onAdd}
            startIcon={<AddIcon />}
            color="primary"
          >
            {addLabel}
          </Button>
        )}
        
        {showFilter && onFilter && (
          <Button
            onClick={onFilter}
            startIcon={<FilterIcon />}
            color="inherit"
          >
            Filtri
          </Button>
        )}

        {showExport && onExport && (
          <Button
            onClick={onExport}
            startIcon={<ExportIcon />}
            color="inherit"
          >
            {exportLabel}
          </Button>
        )}

        {showRefresh && onRefresh && (
          <Button
            onClick={onRefresh}
            startIcon={<RefreshIcon />}
            color="inherit"
            sx={{ minWidth: 44 }}
          >
            <span className="sr-only">Aggiorna</span>
          </Button>
        )}
      </ButtonGroup>
    </Box>
  )
}