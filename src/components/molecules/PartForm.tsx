'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
  Alert,
  Box,
  Typography,
} from '@mui/material'
import { Input } from '@/components/atoms/Input'
import { Button } from '@/components/atoms/Button'
import { LoadingButton } from '@/components/atoms/LoadingButton'
import { createPartSchema, updatePartSchema, type CreatePartInput, type UpdatePartInput } from '@/domains/core/schemas/part.schema'
import { usePermissions } from '@/hooks/usePermissions'

interface PartFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreatePartInput | UpdatePartInput) => Promise<void>
  initialData?: Partial<UpdatePartInput>
  mode: 'create' | 'edit'
  curingCycles?: Array<{ id: string; code: string; name: string }>
  loading?: boolean
}

export function PartForm({
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
  curingCycles = [],
  loading = false,
}: PartFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const permissions = usePermissions()
  
  const schema = mode === 'create' ? createPartSchema : updatePartSchema
  const canSubmit = mode === 'create' ? permissions.parts.canCreate : permissions.parts.canUpdate

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    // @ts-expect-error - Complex union type resolver issue
    resolver: zodResolver(schema),
    defaultValues: initialData || {
      partNumber: '',
      description: '',
      standardLength: undefined,
      standardWidth: undefined,
      standardHeight: undefined,
      defaultVacuumLines: undefined,
      defaultCuringCycleId: undefined,
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

          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Part Number */}
            <Grid size={{ xs: 12, md: 6 }}>
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
            </Grid>

            {/* Description */}
            <Grid size={{ xs: 12 }}>
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
            </Grid>

            {/* Dimensions Section */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>
                Standard Dimensions (optional)
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="standardLength"
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <Input
                    {...field}
                    type="number"
                    label="Length (mm)"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    error={!!errors.standardLength}
                    helperText={errors.standardLength?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="standardWidth"
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <Input
                    {...field}
                    type="number"
                    label="Width (mm)"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    error={!!errors.standardWidth}
                    helperText={errors.standardWidth?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="standardHeight"
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <Input
                    {...field}
                    type="number"
                    label="Height (mm)"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    error={!!errors.standardHeight}
                    helperText={errors.standardHeight?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>

            {/* Production Settings */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>
                Production Settings (optional)
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="defaultVacuumLines"
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <Input
                    {...field}
                    type="number"
                    label="Default Vacuum Lines"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    inputProps={{ min: 1, max: 10 }}
                    error={!!errors.defaultVacuumLines}
                    helperText={errors.defaultVacuumLines?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="defaultCuringCycleId"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    select
                    label="Default Curing Cycle"
                    value={field.value || ''}
                    error={!!errors.defaultCuringCycleId}
                    helperText={errors.defaultCuringCycleId?.message}
                    disabled={loading}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {curingCycles.map((cycle) => (
                      <MenuItem key={cycle.id} value={cycle.id}>
                        {cycle.code} - {cycle.name}
                      </MenuItem>
                    ))}
                  </Input>
                )}
              />
            </Grid>
          </Grid>
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