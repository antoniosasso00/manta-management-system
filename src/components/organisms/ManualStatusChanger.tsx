'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  FormControlLabel,
  Switch,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Snackbar
} from '@mui/material';
import {
  Edit,
  Warning,
  CheckCircle,
  ArrowForward,
  AdminPanelSettings,
  Build
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';

interface ODL {
  id: string;
  odlNumber: string;
  status: string;
  partNumber?: string;
  part?: {
    partNumber: string;
    description?: string;
  };
}

interface ManualStatusChangerProps {
  odl: ODL;
  onStatusChanged?: (newStatus: string) => void;
  departmentContext?: string;
}

// Stati ODL con etichette italiane
const ODL_STATUSES = {
  'CREATED': 'Creato',
  'IN_CLEANROOM': 'In Clean Room',
  'CLEANROOM_COMPLETED': 'Clean Room Completato',
  'IN_AUTOCLAVE': 'In Autoclave',
  'AUTOCLAVE_COMPLETED': 'Autoclave Completato',
  'IN_CONTROLLO_NUMERICO': 'In Controllo Numerico',
  'CONTROLLO_NUMERICO_COMPLETED': 'CNC Completato',
  'IN_NDI': 'In NDI',
  'NDI_COMPLETED': 'NDI Completato',
  'IN_MONTAGGIO': 'In Montaggio',
  'MONTAGGIO_COMPLETED': 'Montaggio Completato',
  'IN_VERNICIATURA': 'In Verniciatura',
  'VERNICIATURA_COMPLETED': 'Verniciatura Completata',
  'IN_CONTROLLO_QUALITA': 'In Controllo Qualità',
  'CONTROLLO_QUALITA_COMPLETED': 'Controllo Qualità Completato',
  'COMPLETED': 'Completato',
  'ON_HOLD': 'In Attesa',
  'CANCELLED': 'Cancellato'
} as const;

// Colori per stati
const STATUS_COLORS = {
  'CREATED': 'default',
  'IN_CLEANROOM': 'info',
  'CLEANROOM_COMPLETED': 'success',
  'IN_AUTOCLAVE': 'warning',
  'AUTOCLAVE_COMPLETED': 'success',
  'IN_CONTROLLO_NUMERICO': 'info',
  'CONTROLLO_NUMERICO_COMPLETED': 'success',
  'IN_NDI': 'info',
  'NDI_COMPLETED': 'success',
  'IN_MONTAGGIO': 'info',
  'MONTAGGIO_COMPLETED': 'success',
  'IN_VERNICIATURA': 'info',
  'VERNICIATURA_COMPLETED': 'success',
  'IN_CONTROLLO_QUALITA': 'info',
  'CONTROLLO_QUALITA_COMPLETED': 'success',
  'COMPLETED': 'success',
  'ON_HOLD': 'warning',
  'CANCELLED': 'error'
} as const;

export default function ManualStatusChanger({ 
  odl, 
  onStatusChanged,
  departmentContext 
}: ManualStatusChangerProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [reason, setReason] = useState('');
  const [forceChange, setForceChange] = useState(false);
  const [bypassWorkflow, setBypassWorkflow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Verifica permessi
  const canChangeStatus = user?.role === 'ADMIN' || 
                         user?.role === 'SUPERVISOR' ||
                         user?.departmentRole === 'CAPO_REPARTO' ||
                         user?.departmentRole === 'CAPO_TURNO';

  const isAdmin = user?.role === 'ADMIN';
  const isSupervisor = user?.role === 'SUPERVISOR';
  
  // Verifica se l'ODL è in uno stato completato per il reparto corrente
  const isODLCompleted = odl.status.includes('_COMPLETED') || odl.status === 'COMPLETED';
  
  // Non mostrare il componente se l'ODL è completato (a meno che non sia admin)
  if (!canChangeStatus || (isODLCompleted && !isAdmin)) {
    return null;
  }

  const handleOpen = () => {
    setOpen(true);
    setError(null);
    setSuggestions([]);
    setSelectedStatus('');
    setReason('');
    setForceChange(false);
    setBypassWorkflow(false);
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
    setSuggestions([]);
  };

  const handleStatusChange = async () => {
    if (!selectedStatus || !reason.trim()) {
      setError('Seleziona uno stato e fornisci un motivo');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/odl/${odl.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newStatus: selectedStatus,
          reason: reason.trim(),
          forceChange,
          bypassWorkflow
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.suggestions) {
          setSuggestions(data.suggestions);
        }
        throw new Error(data.reason || data.error || 'Errore cambio stato');
      }

      // Successo
      setSuccessMessage(data.message || 'Stato aggiornato con successo');
      handleClose();
      onStatusChanged?.(selectedStatus);

    } catch (error) {
      console.error('Status change error:', error);
      setError(error instanceof Error ? error.message : 'Errore durante cambio stato');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendedStatuses = (): string[] => {
    const current = odl.status;
    
    // Workflow suggerito in base allo stato corrente
    const workflow = {
      'CREATED': ['IN_CLEANROOM'],
      'IN_CLEANROOM': ['CLEANROOM_COMPLETED'],
      'CLEANROOM_COMPLETED': ['IN_AUTOCLAVE'],
      'IN_AUTOCLAVE': ['AUTOCLAVE_COMPLETED'],
      'AUTOCLAVE_COMPLETED': ['IN_CONTROLLO_NUMERICO'],
      'IN_CONTROLLO_NUMERICO': ['CONTROLLO_NUMERICO_COMPLETED'],
      'CONTROLLO_NUMERICO_COMPLETED': ['IN_NDI'],
      'IN_NDI': ['NDI_COMPLETED'],
      'NDI_COMPLETED': ['IN_MONTAGGIO'],
      'IN_MONTAGGIO': ['MONTAGGIO_COMPLETED'],
      'MONTAGGIO_COMPLETED': ['IN_VERNICIATURA'],
      'IN_VERNICIATURA': ['VERNICIATURA_COMPLETED'],
      'VERNICIATURA_COMPLETED': ['IN_CONTROLLO_QUALITA'],
      'IN_CONTROLLO_QUALITA': ['CONTROLLO_QUALITA_COMPLETED'],
      'CONTROLLO_QUALITA_COMPLETED': ['COMPLETED']
    } as const;

    const recommended = workflow[current as keyof typeof workflow] || [];
    
    // Aggiungi sempre ON_HOLD come opzione
    return [...recommended, 'ON_HOLD'];
  };

  return (
    <>
      <Card sx={{ mt: 2, bgcolor: isODLCompleted && !isAdmin ? 'action.disabledBackground' : 'background.paper' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Build color={isODLCompleted && !isAdmin ? 'disabled' : 'primary'} />
                Cambio Stato Manuale
                {isODLCompleted && isAdmin && (
                  <Chip 
                    label="Solo Admin" 
                    size="small" 
                    color="warning"
                    icon={<AdminPanelSettings />}
                  />
                )}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Typography variant="body2" color="text.secondary" component="div">
                  ODL: {odl.odlNumber} | Stato attuale:
                  <Chip 
                    label={ODL_STATUSES[odl.status as keyof typeof ODL_STATUSES] || odl.status}
                    color={STATUS_COLORS[odl.status as keyof typeof STATUS_COLORS] || 'default'}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
              </Box>
            </Box>
            
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={handleOpen}
              sx={{ minWidth: 140 }}
              color={isODLCompleted ? 'warning' : 'primary'}
            >
              Cambia Stato
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            m: { xs: 1, sm: 2 },
            maxHeight: { xs: '90vh', sm: '80vh' }
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Edit color="primary" />
            Cambio Stato Manuale - ODL {odl.odlNumber}
            {isAdmin && (
              <Chip 
                icon={<AdminPanelSettings />}
                label="Admin"
                color="error"
                size="small"
              />
            )}
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Part Number:</strong> {odl.part?.partNumber || odl.partNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Stato Attuale:</strong> {ODL_STATUSES[odl.status as keyof typeof ODL_STATUSES]}
            </Typography>
            {departmentContext && (
              <Typography variant="body2" color="text.secondary">
                <strong>Contesto:</strong> {departmentContext}
              </Typography>
            )}
          </Box>

          {/* Stati Raccomandati */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle color="success" fontSize="small" />
              Stati Raccomandati dal Workflow
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              flexWrap: 'wrap',
              '& .MuiChip-root': { 
                m: 0.5,
                minHeight: { xs: 44, sm: 32 } // Touch target mobile
              }
            }}>
              {getRecommendedStatuses().map(status => (
                <Chip
                  key={status}
                  label={ODL_STATUSES[status as keyof typeof ODL_STATUSES]}
                  variant={selectedStatus === status ? 'filled' : 'outlined'}
                  color="success"
                  clickable
                  onClick={() => setSelectedStatus(status)}
                />
              ))}
            </Box>
          </Box>

          {/* Selezione Stato */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Nuovo Stato *</InputLabel>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              label="Nuovo Stato *"
            >
              {Object.entries(ODL_STATUSES).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      size="small"
                      label={label}
                      color={STATUS_COLORS[value as keyof typeof STATUS_COLORS]}
                    />
                    {getRecommendedStatuses().includes(value) && (
                      <ArrowForward color="success" fontSize="small" />
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Motivo */}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Motivo del Cambio *"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Descrivi il motivo per cui stai cambiando manualmente lo stato dell'ODL..."
            sx={{ mb: 3 }}
          />

          {/* Opzioni Avanzate */}
          {(isSupervisor || isAdmin) && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Opzioni Avanzate
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={forceChange}
                    onChange={(e) => setForceChange(e.target.checked)}
                  />
                }
                label="Forza Cambio (ignora alcune validazioni)"
              />
              
              {isAdmin && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={bypassWorkflow}
                      onChange={(e) => setBypassWorkflow(e.target.checked)}
                    />
                  }
                  label="Bypass Workflow (solo Admin)"
                />
              )}
            </Box>
          )}

          {/* Errori e Suggerimenti */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
              
              {suggestions.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Suggerimenti:
                  </Typography>
                  <List dense>
                    {suggestions.map((suggestion, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Warning color="warning" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={suggestion} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Annulla
          </Button>
          <Button
            variant="contained"
            onClick={handleStatusChange}
            disabled={loading || !selectedStatus || !reason.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            {loading ? 'Aggiornando...' : 'Aggiorna Stato'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar per messaggi di successo */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSuccessMessage('')} 
          severity="success"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
}