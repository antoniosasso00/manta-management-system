'use client'

import { TextField, TextFieldProps } from '@mui/material'
import { forwardRef } from 'react'

export type InputProps = TextFieldProps

export const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  return (
    <TextField
      inputRef={ref}
      fullWidth
      variant="outlined"
      InputLabelProps={{
        shrink: true,
        ...props.InputLabelProps,
      }}
      {...props}
    />
  )
})

Input.displayName = 'Input'