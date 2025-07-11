'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Button,
  Collapse,
} from '@mui/material';
import {
  Assignment,
  ExpandMore,
  ExpandLess,
  Info,
} from '@mui/icons-material';

interface ODLData {
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

interface ODLPreviewProps {
  curingCycleId: string;
}

export function ODLPreview({ curingCycleId }: ODLPreviewProps) {
  const [odls, setOdls] = useState<ODLData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [expanded, setExpanded] = useState(false);
  const [warnings, setWarnings] = useState<any>(null);

  useEffect(() => {
    if (curingCycleId) {
      fetchODLs();
    }
  }, [curingCycleId]);

  const fetchODLs = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams({
        curingCycleId,
        limit: '10',
      });

      const response = await fetch(`/api/autoclavi/available-odls?${params}`);
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sessione scaduta, ricarica la pagina');
        }
        throw new Error('Errore caricamento ODL');
      }
      
      const data = await response.json();
      setOdls(data.odls || []);
      setWarnings(data.warnings || null);
      
      // Mostra warnings se ci sono configurazioni mancanti
      if (data.warnings && (data.warnings.missingAutoclaveConfig > 0 || data.warnings.missingPartTools > 0)) {
        console.warn('Configurazioni mancanti rilevate:', data.warnings);
      }
    } catch (error) {
      console.error('Errore fetch ODL preview:', error);
      setError('Errore nel caricamento degli ODL');
    } finally {
      setLoading(false);
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

  const formatVolume = (volume: number) => {
    if (volume < 1000) return `${Math.round(volume)} cm³`;
    return `${(volume / 1000000).toFixed(2)} m³`;
  };

  const formatDimensions = (dimensions: any) => {
    if (!dimensions) return 'N/D';
    const { length, width, height } = dimensions;
    if (!length || !width || !height) return 'N/D';
    return `${length}×${width}×${height} cm`;
  };

  const totalQuantity = odls.reduce((sum, odl) => sum + odl.quantity, 0);
  const totalVolume = odls.reduce((sum, odl) => sum + (odl.estimatedVolume || 0), 0);

  return (
    <Card variant="outlined">
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center">
            <Info sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">
              ODL Associate al Ciclo
            </Typography>
          </Box>
          <Button
            endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
            onClick={() => setExpanded(!expanded)}
            size="small"
          >
            {expanded ? 'Nascondi' : 'Mostra'} Dettagli
          </Button>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Box>
            {/* Riepilogo rapido */}
            <Box display="flex" gap={3} mb={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  ODL Disponibili
                </Typography>
                <Typography variant="h6">
                  {odls.length}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Quantità Totale
                </Typography>
                <Typography variant="h6">
                  {totalQuantity} pz
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Volume Stimato
                </Typography>
                <Typography variant="h6">
                  {formatVolume(totalVolume)}
                </Typography>
              </Box>
            </Box>

            {/* Warnings per configurazioni mancanti */}
            {warnings && (
              <>
                {warnings.missingAutoclaveConfig > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Configurazioni Autoclave mancanti:</strong> {warnings.missingAutoclaveConfig} ODL non hanno configurazioni per l'autoclave.
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Per configurare: vai a <strong>Configurazione Parti</strong> → seleziona parte → aggiungi configurazione autoclave
                    </Typography>
                  </Alert>
                )}
                {warnings.missingPartTools > 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Associazioni Tool mancanti:</strong> {warnings.missingPartTools} ODL non hanno tool associati (verranno usate dimensioni standard).
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Per configurare: vai a <strong>Configurazione Parti</strong> → seleziona parte → associa tool
                    </Typography>
                  </Alert>
                )}
                {warnings.noMatchingCycle > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Ciclo di cura non compatibile:</strong> {warnings.noMatchingCycle} ODL hanno un ciclo di cura diverso da quello selezionato.
                    </Typography>
                  </Alert>
                )}
              </>
            )}

            {odls.length === 0 ? (
              <Alert severity="info">
                Nessun ODL disponibile per questo ciclo di cura
              </Alert>
            ) : (
              <Collapse in={expanded}>
                <Divider sx={{ mb: 2 }} />
                <List>
                  {odls.slice(0, 5).map((odl, index) => (
                    <ListItem key={odl.id}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <Assignment />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle2">
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
                          <Box component="div">
                            <Box component="div" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                              {odl.partNumber} - {odl.partDescription}
                            </Box>
                            <Box component="div" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                              Qta: {odl.quantity} • {formatDimensions(odl.dimensions)} • Vol: {formatVolume(odl.estimatedVolume)}
                            </Box>
                          </Box>
                        }
                        primaryTypographyProps={{ component: 'div' }}
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItem>
                  ))}
                  {odls.length > 5 && (
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box component="div" sx={{ color: 'text.secondary', fontSize: '0.875rem', textAlign: 'center' }}>
                            ... e altri {odls.length - 5} ODL disponibili
                          </Box>
                        }
                        primaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItem>
                  )}
                </List>
              </Collapse>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

