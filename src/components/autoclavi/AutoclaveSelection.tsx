'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import { LocalFireDepartment, Settings } from '@mui/icons-material';
import { ODLPreview } from './ODLPreview';

interface AutoclaveData {
  id: string;
  code: string;
  name: string;
  maxLength: number;
  maxWidth: number;
  vacuumLines: number;
  isActive: boolean;
  curingCycles: Array<{
    id: string;
    name: string;
    description?: string;
    totalDuration: number;
    maxTemperature: number;
    maxPressure: number;
  }>;
}

interface AutoclaveSelectionProps {
  selectedAutoclave: any;
  selectedCuringCycle: string;
  onAutoclaveSelect: (autoclave: any) => void;
  onCuringCycleSelect: (cycleId: string) => void;
}

export function AutoclaveSelection({
  selectedAutoclave,
  selectedCuringCycle,
  onAutoclaveSelect,
  onCuringCycleSelect,
}: AutoclaveSelectionProps) {
  const [autoclaves, setAutoclaves] = useState<AutoclaveData[]>([]);
  const [curingCycles, setCuringCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchAutoclaves();
    fetchCuringCycles();
  }, []);

  const fetchAutoclaves = async () => {
    try {
      const response = await fetch('/api/autoclavi');
      if (!response.ok) {
        if (response.status === 401) {
          setError('Accesso non autorizzato. Effettua il login per continuare.');
        } else {
          throw new Error('Errore caricamento autoclavi');
        }
        return;
      }
      
      const data = await response.json();
      setAutoclaves(data.autoclaves || []);
    } catch (error) {
      console.error('Errore fetch autoclavi:', error);
      setError('Errore nel caricamento delle autoclavi');
    }
  };

  const fetchCuringCycles = async () => {
    try {
      const response = await fetch('/api/curing-cycles');
      if (!response.ok) {
        if (response.status === 401) {
          setError('Accesso non autorizzato. Effettua il login per continuare.');
        } else {
          throw new Error('Errore caricamento cicli');
        }
        return;
      }
      
      const data = await response.json();
      setCuringCycles(data.cycles || []);
    } catch (error) {
      console.error('Errore fetch cicli:', error);
      setError('Errore nel caricamento dei cicli di cura');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoclaveSelect = (autoclave: AutoclaveData) => {
    // Aggiungi cicli di cura compatibili all'autoclave selezionata
    const autoclaveWithCycles = {
      ...autoclave,
      curingCycles: curingCycles,
    };
    
    onAutoclaveSelect(autoclaveWithCycles);
    onCuringCycleSelect(''); // Reset selezione ciclo
  };

  const formatArea = (length: number, width: number) => {
    const area = (length * width) / 10000; // cm² to m²
    return `${area.toFixed(2)} m²`;
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    return `${hours}h`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Seleziona Autoclave
      </Typography>
      
      {/* Griglia Autoclavi */}
      <Grid container spacing={2} mb={4}>
        {autoclaves.map((autoclave) => (
          <Grid size={{ xs: 12, md: 6 }} key={autoclave.id}>
            <Card
              sx={{
                cursor: 'pointer',
                border: selectedAutoclave?.id === autoclave.id ? 2 : 1,
                borderColor: selectedAutoclave?.id === autoclave.id 
                  ? 'primary.main' 
                  : 'divider',
                '&:hover': {
                  borderColor: 'primary.light',
                  boxShadow: 2,
                },
              }}
              onClick={() => handleAutoclaveSelect(autoclave)}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <LocalFireDepartment sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">
                    {autoclave.name}
                  </Typography>
                  <Chip
                    label={autoclave.code}
                    size="small"
                    sx={{ ml: 'auto' }}
                  />
                  {!autoclave.isActive && (
                    <Chip
                      label="Inattiva"
                      size="small"
                      color="error"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>

                <List dense>
                  <ListItem disablePadding>
                    <ListItemText
                      primary="Dimensioni"
                      secondary={`${autoclave.maxLength} × ${autoclave.maxWidth} cm`}
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemText
                      primary="Area"
                      secondary={formatArea(autoclave.maxLength, autoclave.maxWidth)}
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemText
                      primary="Linee Vuoto"
                      secondary={`${autoclave.vacuumLines} linee disponibili`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Selezione Ciclo di Cura */}
      {selectedAutoclave && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>
            Seleziona Ciclo di Cura
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Ciclo di Cura</InputLabel>
            <Select
              value={selectedCuringCycle}
              onChange={(e) => onCuringCycleSelect(e.target.value)}
              label="Ciclo di Cura"
            >
              {curingCycles.map((cycle) => (
                <MenuItem key={cycle.id} value={cycle.id}>
                  <Box component="div">
                    <Box component="div" sx={{ fontSize: '1rem' }}>
                      {cycle.name}
                    </Box>
                    <Box component="div" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                      {formatDuration(cycle.totalDuration)} • 
                      {cycle.maxTemperature}°C • 
                      {cycle.maxPressure} bar
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Dettagli Ciclo Selezionato */}
          {selectedCuringCycle && (
            <>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  {(() => {
                    const cycle = curingCycles.find(c => c.id === selectedCuringCycle);
                    if (!cycle) return null;
                    
                    return (
                      <Box>
                        <Box display="flex" alignItems="center" mb={2}>
                          <Settings sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="h6">
                            {cycle.name}
                          </Typography>
                        </Box>
                        
                        {cycle.description && (
                          <Typography variant="body2" color="text.secondary" mb={2}>
                            {cycle.description}
                          </Typography>
                        )}
                        
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <Box textAlign="center">
                              <Settings sx={{ color: 'primary.main', mb: 1 }} />
                              <Typography variant="body2" color="text.secondary">
                                Durata
                              </Typography>
                              <Typography variant="h6">
                                {formatDuration(cycle.totalDuration)}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <Box textAlign="center">
                              <Typography variant="body2" color="text.secondary">
                                Temp. Max
                              </Typography>
                              <Typography variant="h6">
                                {cycle.maxTemperature}°C
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <Box textAlign="center">
                              <Typography variant="body2" color="text.secondary">
                                Press. Max
                              </Typography>
                              <Typography variant="h6">
                                {cycle.maxPressure} bar
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <Box textAlign="center">
                              <Typography variant="body2" color="text.secondary">
                                Compatibilità
                              </Typography>
                              <Chip
                                label="✓ Compositi"
                                size="small"
                                color="success"
                              />
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    );
                  })()}
                </CardContent>
              </Card>
              
              {/* Riepilogo ODL Associate al Ciclo */}
              <ODLPreview curingCycleId={selectedCuringCycle} />
            </>
          )}
        </>
      )}
    </Box>
  );
}