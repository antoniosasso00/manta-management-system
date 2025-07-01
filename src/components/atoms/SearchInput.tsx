'use client'

import { TextField, InputAdornment } from '@mui/material'
import { Search } from '@mui/icons-material'
import { forwardRef } from 'react'

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  fullWidth?: boolean
  disabled?: boolean
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onChange, placeholder = 'Search...', fullWidth = true, disabled, ...props }, ref) => {
    return (
      <TextField
        inputRef={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        fullWidth={fullWidth}
        disabled={disabled}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
        {...props}
      />
    )
  }
)

SearchInput.displayName = 'SearchInput'