'use client'

import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Chip,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material'
import { Controller, Control, FieldErrors } from 'react-hook-form'

interface CuringCycle {
  id: string
  name: string
  duration: number
}

interface DepartmentConfigurationSectionProps {
  control: Control<any>
  errors?: FieldErrors<any>
  curingCycles: CuringCycle[]
  mode?: 'create' | 'edit'
}

export default function DepartmentConfigurationSection({
  control,
  errors,
  curingCycles,
  mode = 'create'
}: DepartmentConfigurationSectionProps) {
  return (
    <>
      <Typography variant="h6" gutterBottom>
        Configurazioni per Reparto ({mode === 'edit' ? 'Override' : 'Opzionali'})
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configura parametri specifici per ogni reparto. Se non specificati, verranno utilizzati i valori di default della parte.
      </Typography>
      
      {/* Autoclave Configuration */}
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label="Autoclavi" color="primary" size="small" />
            <Typography variant="subtitle1">Configurazione Autoclavi</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name={mode === 'create' ? 'partAutoclave.curingCycleId' : 'curingCycleId'}
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Ciclo di Cura (override)</InputLabel>
                    <Select {...field} value={field.value || ''} label="Ciclo di Cura (override)">
                      <MenuItem value="">
                        <em>Usa default della parte</em>
                      </MenuItem>
                      {curingCycles.map((cycle) => (
                        <MenuItem key={cycle.id} value={cycle.id}>
                          {cycle.name} ({cycle.duration}min)
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name={mode === 'create' ? 'partAutoclave.vacuumLines' : 'vacuumLines'}
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <TextField
                    {...field}
                    value={value === undefined ? '' : value}
                    onChange={(e) => onChange(e.target.value === '' ? undefined : parseInt(e.target.value) || undefined)}
                    label="Linee Vacuum (override)"
                    type="number"
                    fullWidth
                    InputProps={{ inputProps: { min: 1, max: 10 } }}
                    placeholder="Default della parte"
                  />
                )}
              />
            </Grid>
            {mode === 'create' && (
              <>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="partAutoclave.setupTime"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <TextField
                        {...field}
                        value={value === undefined ? '' : value}
                        onChange={(e) => onChange(e.target.value === '' ? undefined : parseInt(e.target.value) || undefined)}
                        label="Tempo Setup (minuti)"
                        type="number"
                        fullWidth
                        InputProps={{ inputProps: { min: 1 } }}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="partAutoclave.loadPosition"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Posizione Carico Preferita"
                        fullWidth
                        placeholder="es. Zona A, Livello 2"
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="partAutoclave.notes"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Note Specifiche Autoclave"
                        multiline
                        rows={2}
                        fullWidth
                        placeholder="Note specifiche per il processo in autoclave..."
                      />
                    )}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Clean Room Configuration */}
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label="Clean Room" color="success" size="small" />
            <Typography variant="subtitle1">Configurazione Clean Room</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {mode === 'create' ? (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="partCleanroom.resinType"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Tipo Resina"
                      fullWidth
                      placeholder="es. Epoxy, Poliestere"
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="partCleanroom.prepregCode"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Codice Prepreg"
                      fullWidth
                      placeholder="es. T300/5208"
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="partCleanroom.roomTemperature"
                  control={control}
                  render={({ field: { onChange, value, ...field } }) => (
                    <TextField
                      {...field}
                      value={value === undefined ? '' : value}
                      onChange={(e) => onChange(e.target.value === '' ? undefined : parseFloat(e.target.value) || undefined)}
                      label="Temperatura Stanza (°C)"
                      type="number"
                      fullWidth
                      InputProps={{ inputProps: { min: 15, max: 30, step: 0.1 } }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="partCleanroom.humidity"
                  control={control}
                  render={({ field: { onChange, value, ...field } }) => (
                    <TextField
                      {...field}
                      value={value === undefined ? '' : value}
                      onChange={(e) => onChange(e.target.value === '' ? undefined : parseFloat(e.target.value) || undefined)}
                      label="Umidità (%)"
                      type="number"
                      fullWidth
                      InputProps={{ inputProps: { min: 0, max: 100, step: 1 } }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="partCleanroom.shelfLife"
                  control={control}
                  render={({ field: { onChange, value, ...field } }) => (
                    <TextField
                      {...field}
                      value={value === undefined ? '' : value}
                      onChange={(e) => onChange(e.target.value === '' ? undefined : parseInt(e.target.value) || undefined)}
                      label="Shelf Life (giorni)"
                      type="number"
                      fullWidth
                      InputProps={{ inputProps: { min: 1 } }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Le configurazioni Clean Room vengono gestite attraverso le relazioni con la parte.
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* NDI Configuration */}
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label="NDI" color="warning" size="small" />
            <Typography variant="subtitle1">Configurazione NDI</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {mode === 'create' ? (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="partNDI.inspectionTime"
                  control={control}
                  render={({ field: { onChange, value, ...field } }) => (
                    <TextField
                      {...field}
                      value={value === undefined ? '' : value}
                      onChange={(e) => onChange(e.target.value === '' ? undefined : parseInt(e.target.value) || undefined)}
                      label="Tempo Ispezione (minuti)"
                      type="number"
                      fullWidth
                      InputProps={{ inputProps: { min: 1 } }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="partNDI.calibrationReq"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Requisiti Calibrazione"
                      fullWidth
                      placeholder="es. Calibrazione giornaliera"
                    />
                  )}
                />
              </Grid>
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Le configurazioni NDI vengono gestite attraverso le relazioni con la parte.
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>
    </>
  )
}