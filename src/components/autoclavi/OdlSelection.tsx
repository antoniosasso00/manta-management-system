'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  Search,
  Add,
  Remove,
  Engineering,
  Inventory,
  Speed,
  AspectRatio,
} from '@mui/icons-material';

interface OdlData {
  id: string;
  odlNumber: string;
  partNumber: string;
  partDescription: string;
  quantity: number;
  priority: string;
  curingCycleId: string;
  curingCycleName: string;
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
  };
  estimatedVolume: number;
}

interface OdlSelectionProps {
  curingCycleId: string;
  selectedOdls: any[];
  onOdlsSelect: (odls: any[]) => void;
  autoclaveCapacity?: {
    maxLength: number;
    maxWidth: number;
    maxHeight: number;
  };
}

export function OdlSelection({
  curingCycleId,
  selectedOdls,
  onOdlsSelect,
  autoclaveCapacity,
}: OdlSelectionProps) {
  const [availableOdls, setAvailableOdls] = useState<OdlData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (curingCycleId) {
      fetchAvailableOdls();
    }
  }, [curingCycleId]);

  const fetchAvailableOdls = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        curingCycleId,
        limit: '100',
      });
      
      if (searchTerm) {
        params.set('search', searchTerm);
      }

      const response = await fetch(`/api/autoclavi/available-odls?${params}`);
      if (!response.ok) throw new Error('Errore caricamento ODL');
      
      const data = await response.json();
      setAvailableOdls(data.odls || []);
    } catch (error) {
      console.error('Errore fetch ODL:', error);
      setError('Errore nel caricamento degli ODL disponibili');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchAvailableOdls();
  };

  const handleOdlToggle = (odl: OdlData) => {
    const isSelected = selectedOdls.some(selected => selected.id === odl.id);
    
    if (isSelected) {
      // Rimuovi ODL
      onOdlsSelect(selectedOdls.filter(selected => selected.id !== odl.id));
    } else {
      // Aggiungi ODL
      onOdlsSelect([...selectedOdls, odl]);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'warning';
      case 'NORMAL': return 'info';
      case 'LOW': return 'default';
      default: return 'default';
    }
  };

  const calculateTotalVolume = () => {
    return selectedOdls.reduce((sum, odl) => sum + (odl.estimatedVolume || 0), 0);
  };

  const calculateCapacityUtilization = () => {
    if (!autoclaveCapacity) return 0;
    
    const totalVolume = calculateTotalVolume();
    const autoclaveVolume = autoclaveCapacity.maxLength * autoclaveCapacity.maxWidth * autoclaveCapacity.maxHeight;
    
    return (totalVolume / autoclaveVolume) * 100;
  };

  const formatVolume = (volume: number) => {
    if (volume < 1000) return `${Math.round(volume)} cm³`;
    return `${(volume / 1000000).toFixed(2)} m³`;
  };

  const formatDimensions = (dimensions: any) => {
    const { length, width, height } = dimensions;
    if (!length || !width || !height) return 'N/D';
    return `${length}×${width}×${height} cm`;
  };

  const utilizationPercentage = calculateCapacityUtilization();
  const isOverCapacity = utilizationPercentage > 100;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Seleziona ODL per il Batch
      </Typography>

      {/* Barra di Ricerca */}
      <Box display="flex" gap={2} mb={3}>
        <TextField
          fullWidth
          label="Cerca ODL (numero, codice pezzo, descrizione)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={loading}
        >
          Cerca
        </Button>
      </Box>

      {/* Riepilogo Selezione */}
      {selectedOdls.length > 0 && (
        <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              ODL Selezionati ({selectedOdls.length})
            </Typography>
            
            <Grid container spacing={2} mb={2}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Quantità Totale
                </Typography>
                <Typography variant="h6">
                  {selectedOdls.reduce((sum, odl) => sum + odl.quantity, 0)} pz
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Volume Stimato
                </Typography>
                <Typography variant="h6">
                  {formatVolume(calculateTotalVolume())}
                </Typography>
              </Grid>
              {autoclaveCapacity && (
                <>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Utilizzo Autoclave
                    </Typography>
                    <Typography 
                      variant="h6" 
                      color={isOverCapacity ? 'error.main' : 'success.main'}
                    >
                      {utilizationPercentage.toFixed(1)}%
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Capacità
                    </Typography>
                    <Typography variant="body2">
                      {formatVolume(autoclaveCapacity.maxLength * autoclaveCapacity.maxWidth * autoclaveCapacity.maxHeight)}
                    </Typography>
                  </Grid>
                </>
              )}
            </Grid>

            {/* Barra di utilizzo */}
            {autoclaveCapacity && (
              <Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(utilizationPercentage, 100)}
                  color={isOverCapacity ? 'error' : 'success'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                {isOverCapacity && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    Attenzione: Il volume selezionato supera la capacità dell'autoclave
                  </Alert>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista ODL Disponibili */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              ODL Disponibili ({availableOdls.length})
            </Typography>
            
            {availableOdls.length === 0 ? (
              <Alert severity="info">
                Nessun ODL disponibile per il ciclo di cura selezionato
              </Alert>
            ) : (
              <List>
                {availableOdls.map((odl, index) => (
                  <Box key={odl.id}>
                    <ListItem
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        bgcolor: selectedOdls.some(s => s.id === odl.id) 
                          ? 'action.selected' 
                          : 'background.paper',
                      }}
                    >
                      <ListItemIcon>
                        <Checkbox
                          checked={selectedOdls.some(s => s.id === odl.id)}
                          onChange={() => handleOdlToggle(odl)}
                        />
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {odl.odlNumber}
                            </Typography>
                            <Chip
                              label={odl.priority}
                              size="small"
                              color={getPriorityColor(odl.priority) as any}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              <Engineering sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                              {odl.partNumber} - {odl.partDescription}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={2} mt={0.5}>
                              <Typography variant="caption" color="text.secondary">
                                <Inventory sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                                Qta: {odl.quantity}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                <AspectRatio sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                                {formatDimensions(odl.dimensions)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Vol: {formatVolume(odl.estimatedVolume)}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                      
                      <ListItemSecondaryAction>
                        <IconButton
                          onClick={() => handleOdlToggle(odl)}
                          color={selectedOdls.some(s => s.id === odl.id) ? 'error' : 'primary'}
                        >
                          {selectedOdls.some(s => s.id === odl.id) ? <Remove /> : <Add />}
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < availableOdls.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}