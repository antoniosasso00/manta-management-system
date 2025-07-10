'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Box,
} from '@mui/material'
import { Input } from '@/components/atoms/Input'
import { Button } from '@/components/atoms/Button'
import { LoadingButton } from '@/components/atoms/LoadingButton'
import { createPartSchema, updatePartInputSchema, type CreatePartInput, type UpdatePartInput } from '@/domains/core/schemas/part'
import { usePermissions } from '@/hooks/usePermissions'

interface PartFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreatePartInput | UpdatePartInput) => Promise<void>
  initialData?: Partial<UpdatePartInput>
  mode: 'create' | 'edit'
  loading?: boolean
}

export function PartForm({
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
  loading = false,
}: PartFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const permissions = usePermissions()
  
  const schema = mode === 'create' ? createPartSchema : updatePartInputSchema
  const canSubmit = mode === 'create' ? permissions.parts.canCreate : permissions.parts.canUpdate

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData || {
      partNumber: '',
      description: '',
    },
  })

  useEffect(() => {
    if (open && initialData) {
      reset(initialData)
    }
  }, [open, initialData, reset])

  const handleFormSubmit = async (data: CreatePartInput | UpdatePartInput) => {
    if (!canSubmit) {
      setSubmitError('You do not have permission to perform this action')
      return
    }

    try {
      setSubmitError(null)
      await onSubmit(data)
      reset()
      onClose()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  const handleClose = () => {
    setSubmitError(null)
    reset()
    onClose()
  }

  if (!canSubmit) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Access Denied</DialogTitle>
        <DialogContent>
          <Alert severity="error">
            You do not have permission to {mode === 'create' ? 'create' : 'edit'} parts.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === 'create' ? 'Create New Part' : 'Edit Part'}
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} noValidate>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          <Box className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Part Number */}
            <Box className="md:col-span-1">
              <Controller
                name="partNumber"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="Part Number *"
                    placeholder="e.g., 8G5350A0"
                    error={!!errors.partNumber}
                    helperText={errors.partNumber?.message}
                    disabled={loading}
                  />
                )}
              />
            </Box>

            {/* Description */}
            <Box className="col-span-full">
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="Description *"
                    placeholder="Part description"
                    multiline
                    rows={2}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    disabled={loading}
                  />
                )}
              />
            </Box>

            {/* REMOVED: Non-existent fields from Part schema */}
            {/* 
            Dimensions Section - REMOVED (now managed via Tool entities)
            - standardLength → Use Tool.base
            - standardWidth → Use Tool.base
            - standardHeight → Use Tool.height
            
            Production Settings - REMOVED (now managed via extension tables)
            - defaultVacuumLines → Use PartAutoclave.vacuumLines
            - defaultCuringCycleId → Use PartAutoclave.curingCycleId
            */}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <LoadingButton
          onClick={handleSubmit(handleFormSubmit)}
          loading={loading || isSubmitting}
          variant="contained"
        >
          {mode === 'create' ? 'Create Part' : 'Update Part'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}