'use client';

import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
  TextField,
  Chip,
  Stack,
  Divider,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  QrCode2,
  Engineering,
  Straighten,
  LocalFireDepartment,
} from '@mui/icons-material';
import type { OptimizationConstraints } from '@/services/optimization-service';

interface ODLSelectionStepProps {
  availableODLs: any[];
  availableAutoclaves: any[];
  selectedODLs: string[];
  setSelectedODLs: (ids: string[]) => void;
  selectedAutoclaves: string[];
  setSelectedAutoclaves: (ids: string[]) => void;
  constraints: OptimizationConstraints;
  setConstraints: (constraints: OptimizationConstraints) => void;
}

export function ODLSelectionStep({
  availableODLs,
  availableAutoclaves,
  selectedODLs,
  setSelectedODLs,
  selectedAutoclaves,
  setSelectedAutoclaves,
  constraints,
  setConstraints,
}: ODLSelectionStepProps) {
  const handleODLToggle = (odlId: string) => {
    setSelectedODLs(
      selectedODLs.includes(odlId)
        ? selectedODLs.filter(id => id !== odlId)
        : [...selectedODLs, odlId]
    );
  };

  const handleAutoclaveToggle = (autoclaveId: string) => {
    setSelectedAutoclaves(
      selectedAutoclaves.includes(autoclaveId)
        ? selectedAutoclaves.filter(id => id !== autoclaveId)
        : [...selectedAutoclaves, autoclaveId]
    );
  };

  const handleSelectAllODLs = () => {
    if (selectedODLs.length === availableODLs.length) {
      setSelectedODLs([]);
    } else {
      setSelectedODLs(availableODLs.map(odl => odl.id));
    }
  };

  const handleSelectAllAutoclaves = () => {
    if (selectedAutoclaves.length === availableAutoclaves.length) {
      setSelectedAutoclaves([]);
    } else {
      setSelectedAutoclaves(availableAutoclaves.map(a => a.id));
    }
  };

  // Raggruppa ODL per ciclo di cura
  const odlsByCycle = availableODLs.reduce((acc, odl) => {
    const cycle = odl.curingCycle?.code || odl.part.defaultCuringCycle?.code || 'SCONOSCIUTO';
    if (!acc[cycle]) acc[cycle] = [];
    acc[cycle].push(odl);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <Grid container spacing={3}>
      {/* Selezione ODL */}
      <Grid size={12}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Seleziona ODL da Ottimizzare
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedODLs.length === availableODLs.length}
                  indeterminate={
                    selectedODLs.length > 0 && 
                    selectedODLs.length < availableODLs.length
                  }
                  onChange={handleSelectAllODLs}
                />
              }
              label="Seleziona tutti"
            />
          </Box>

          {Object.entries(odlsByCycle).map(([cycle, odls]) => (
            <Box key={cycle} sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Ciclo di Cura: {cycle}
              </Typography>
              
              <List dense>
                {(odls as any[]).map((odl, index) => (
                  <ListItem key={`${cycle}-${odl.id}-${index}`} disablePadding>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedODLs.includes(odl.id)}
                        onChange={() => handleODLToggle(odl.id)}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <QrCode2 fontSize="small" />
                          <Typography variant="body2">
                            {odl.odlNumber}
                          </Typography>
                          <Chip
                            label={odl.part.partNumber}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {odl.part.partTools.length} tool • {odl.part.defaultVacuumLines || 1} linee vuoto
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          ))}

          {availableODLs.length === 0 && (
            <Alert severity="warning">
              Nessun ODL disponibile per l'ottimizzazione nel reparto autoclavi
            </Alert>
          )}
        </Paper>
      </Grid>

      {/* Selezione Autoclavi */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Seleziona Autoclavi
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedAutoclaves.length === availableAutoclaves.length}
                  indeterminate={
                    selectedAutoclaves.length > 0 && 
                    selectedAutoclaves.length < availableAutoclaves.length
                  }
                  onChange={handleSelectAllAutoclaves}
                />
              }
              label="Seleziona tutte"
            />
          </Box>

          <List>
            {availableAutoclaves.map((autoclave, index) => (
              <ListItem key={`autoclave-${autoclave.id}-${index}`} disablePadding>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={selectedAutoclaves.includes(autoclave.id)}
                    onChange={() => handleAutoclaveToggle(autoclave.id)}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocalFireDepartment fontSize="small" color="primary" />
                      <Typography variant="body1">
                        {autoclave.name} ({autoclave.code})
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        icon={<Straighten fontSize="small" />}
                        label={`${autoclave.maxWidth} x ${autoclave.maxLength} mm`}
                        size="small"
                        variant="outlined"
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        label={`${autoclave.vacuumLines} linee`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Grid>

      {/* Vincoli Ottimizzazione */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Vincoli di Ottimizzazione
          </Typography>

          <Stack spacing={2}>
            <TextField
              label="Distanza minima dal bordo (mm)"
              type="number"
              value={constraints.min_border_distance}
              onChange={(e) => setConstraints({
                ...constraints,
                min_border_distance: Number(e.target.value)
              })}
              fullWidth
              InputProps={{
                inputProps: { min: 0, max: 200, step: 10 }
              }}
              helperText="Spazio tra i tool e il bordo dell'autoclave"
            />

            <TextField
              label="Distanza minima tra tool (mm)"
              type="number"
              value={constraints.min_tool_distance}
              onChange={(e) => setConstraints({
                ...constraints,
                min_tool_distance: Number(e.target.value)
              })}
              fullWidth
              InputProps={{
                inputProps: { min: 0, max: 100, step: 5 }
              }}
              helperText="Spazio minimo tra i tool adiacenti"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={constraints.allow_rotation}
                  onChange={(e) => setConstraints({
                    ...constraints,
                    allow_rotation: e.target.checked
                  })}
                />
              }
              label="Permetti rotazione tool (90°)"
            />
          </Stack>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="caption">
              L'algoritmo ottimizzerà il posizionamento dei tool rispettando questi vincoli.
              Valori più alti garantiscono maggiore sicurezza ma riducono l'efficienza.
            </Typography>
          </Alert>
        </Paper>
      </Grid>

      {/* Riepilogo selezione */}
      <Grid size={12}>
        <Alert 
          severity={selectedODLs.length > 0 && selectedAutoclaves.length > 0 ? "success" : "info"}
        >
          <Typography variant="body2">
            {selectedODLs.length} ODL selezionati su {availableODLs.length} disponibili
            {' • '}
            {selectedAutoclaves.length} autoclavi selezionate su {availableAutoclaves.length} disponibili
          </Typography>
        </Alert>
      </Grid>
    </Grid>
  );
}