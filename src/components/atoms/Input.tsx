'use client'

import { TextField, TextFieldProps } from '@mui/material'
import { forwardRef } from 'react'

export type InputProps = TextFieldProps

export const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  return <TextField inputRef={ref} fullWidth {...props} />
})

Input.displayName = 'Input'