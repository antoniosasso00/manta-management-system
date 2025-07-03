'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  LinearProgress,
  Grid,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  MoreVert,
  PlayArrow,
  Stop,
  CheckCircle,
  Send,
  Edit,
  Delete,
  Visibility,
  QrCodeScanner,
  LocalFireDepartment,
  Schedule,
  Inventory,
} from '@mui/icons-material';

interface BatchCardProps {
  batch: {
    id: string;
    loadNumber: string;
    status: string;
    autoclaveName: string;
    curingCycleName: string;
    odlCount: number;
    totalQuantity: number;
    plannedStart: string;
    plannedEnd: string;
    actualStart?: string;
    actualEnd?: string;
    estimatedVolume: number;
    utilizationPercentage: number;
  };
  nextStatus?: string | null;
  canModify?: boolean;
  canDelete?: boolean;
  onAdvance: (targetStatus: string, scannedOdlId?: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewDetails?: () => void;
}

export function BatchCard({
  batch,
  nextStatus,
  canModify = true,
  canDelete = false,
  onAdvance,
  onEdit,
  onDelete,
  onViewDetails,
}: BatchCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [qrScanDialog, setQrScanDialog] = useState(false);
  const [scannedOdlCode, setScannedOdlCode] = useState('');

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAdvanceWithQr = () => {
    if (!nextStatus) return;
    
    // Se lo stato è IN_CURE o superiore, richiedi scan QR
    if (['IN_CURE', 'COMPLETED', 'RELEASED'].includes(batch.status)) {
      setQrScanDialog(true);
    } else {
      onAdvance(nextStatus);
    }
    handleMenuClose();
  };

  const handleQrScanConfirm = () => {
    if (!nextStatus) return;
    
    // Estrai ID ODL dal codice QR scansionato
    // Formato QR: {"type":"ODL","id":"odl_id","timestamp":"..."}
    let scannedOdlId: string | undefined;
    
    try {
      if (scannedOdlCode.startsWith('{')) {
        const qrData = JSON.parse(scannedOdlCode);
        if (qrData.type === 'ODL' && qrData.id) {
          scannedOdlId = qrData.id;
        }
      } else {
        // Assumi che sia un semplice numero ODL
        scannedOdlId = scannedOdlCode.trim();
      }
    } catch (error) {
      console.error('Errore parsing QR code:', error);
    }

    onAdvance(nextStatus, scannedOdlId);
    setQrScanDialog(false);
    setScannedOdlCode('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'default';
      case 'READY': return 'info';
      case 'IN_CURE': return 'warning';
      case 'COMPLETED': return 'success';
      case 'RELEASED': return 'primary';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Bozza';
      case 'READY': return 'Pronto';
      case 'IN_CURE': return 'In Cura';
      case 'COMPLETED': return 'Completato';
      case 'RELEASED': return 'Rilasciato';
      case 'CANCELLED': return 'Annullato';
      default: return status;
    }
  };

  const getAdvanceButtonProps = (status: string, nextStatus?: string | null) => {
    if (!nextStatus) return null;

    switch (nextStatus) {
      case 'READY':
        return { icon: <PlayArrow />, label: 'Prepara', color: 'info' as const };
      case 'IN_CURE':
        return { icon: <PlayArrow />, label: 'Avvia Cura', color: 'warning' as const };
      case 'COMPLETED':
        return { icon: <CheckCircle />, label: 'Completa', color: 'success' as const };
      case 'RELEASED':
        return { icon: <Send />, label: 'Rilascia', color: 'primary' as const };
      default:
        return { icon: <PlayArrow />, label: 'Avanza', color: 'primary' as const };
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getProgressValue = () => {
    switch (batch.status) {
      case 'DRAFT': return 20;
      case 'READY': return 40;
      case 'IN_CURE': return 70;
      case 'COMPLETED': return 90;
      case 'RELEASED': return 100;
      default: return 0;
    }
  };

  const advanceButtonProps = getAdvanceButtonProps(batch.status, nextStatus);
  const isOverCapacity = batch.utilizationPercentage > 100;

  return (
    <>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          border: 1,
          borderColor: isOverCapacity ? 'warning.main' : 'divider',
        }}
      >
        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {batch.loadNumber}
              </Typography>
              <Chip
                label={getStatusLabel(batch.status)}
                color={getStatusColor(batch.status) as any}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Box>
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{ ml: 1 }}
            >
              <MoreVert />
            </IconButton>
          </Box>

          {/* Progress Bar */}
          <Box mb={2}>
            <LinearProgress
              variant="determinate"
              value={getProgressValue()}
              color={getStatusColor(batch.status) as any}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>

          {/* Info Griglia */}
          <Grid container spacing={1} mb={2}>
            <Grid size={{ xs: 12 }}>
              <Box display="flex" alignItems="center" mb={1}>
                <LocalFireDepartment sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" fontWeight="medium">
                  {batch.autoclaveName}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary">
                ODL
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {batch.odlCount}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Quantità
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {batch.totalQuantity} pz
              </Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Utilizzo
              </Typography>
              <Typography 
                variant="body2" 
                fontWeight="bold"
                color={isOverCapacity ? 'warning.main' : 'text.primary'}
              >
                {batch.utilizationPercentage}%
              </Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Ciclo
              </Typography>
              <Typography variant="body2" noWrap title={batch.curingCycleName}>
                {batch.curingCycleName}
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 1 }} />

          {/* Timing */}
          <Box>
            <Box display="flex" alignItems="center" mb={1}>
              <Schedule sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" fontWeight="medium">
                Pianificazione
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Inizio: {formatDateTime(batch.plannedStart)}
            </Typography>
            <br />
            <Typography variant="caption" color="text.secondary">
              Fine: {formatDateTime(batch.plannedEnd)}
            </Typography>
            
            {batch.actualStart && (
              <Box mt={1}>
                <Typography variant="caption" color="success.main">
                  Avviato: {formatDateTime(batch.actualStart)}
                </Typography>
              </Box>
            )}
            
            {batch.actualEnd && (
              <Box>
                <Typography variant="caption" color="success.main">
                  Completato: {formatDateTime(batch.actualEnd)}
                </Typography>
              </Box>
            )}
          </Box>

          {isOverCapacity && (
            <Chip
              label="Sovraccarico"
              color="warning"
              size="small"
              sx={{ mt: 1 }}
            />
          )}
        </CardContent>

        {/* Actions */}
        <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
          <Box display="flex" gap={1} width="100%">
            {advanceButtonProps && (
              <Button
                variant="contained"
                color={advanceButtonProps.color}
                startIcon={advanceButtonProps.icon}
                onClick={handleAdvanceWithQr}
                size="small"
                sx={{ flexGrow: 1 }}
              >
                {advanceButtonProps.label}
              </Button>
            )}
            <Button
              variant="outlined"
              size="small"
              onClick={onViewDetails}
            >
              Dettagli
            </Button>
          </Box>
        </CardActions>
      </Card>

      {/* Menu Actions */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { onViewDetails?.(); handleMenuClose(); }}>
          <Visibility sx={{ mr: 1 }} />
          Visualizza Dettagli
        </MenuItem>
        {canModify && onEdit && (
          <MenuItem onClick={() => { onEdit(); handleMenuClose(); }}>
            <Edit sx={{ mr: 1 }} />
            Modifica Batch
          </MenuItem>
        )}
        {advanceButtonProps && (
          <MenuItem onClick={handleAdvanceWithQr}>
            {advanceButtonProps.icon}
            <Box sx={{ ml: 1 }}>{advanceButtonProps.label}</Box>
          </MenuItem>
        )}
        {canDelete && onDelete && (
          <MenuItem onClick={() => { onDelete(); handleMenuClose(); }} sx={{ color: 'error.main' }}>
            <Delete sx={{ mr: 1 }} />
            Elimina Batch
          </MenuItem>
        )}
      </Menu>

      {/* QR Scan Dialog */}
      <Dialog open={qrScanDialog} onClose={() => setQrScanDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <QrCodeScanner sx={{ mr: 1 }} />
            Scansiona ODL per Avanzamento
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Scansiona il QR code di un ODL presente nel batch per confermare l'avanzamento.
            Questo rappresenterà l'intero batch fisicamente caricato.
          </Typography>
          <TextField
            fullWidth
            label="Codice QR o Numero ODL"
            value={scannedOdlCode}
            onChange={(e) => setScannedOdlCode(e.target.value)}
            placeholder='{"type":"ODL","id":"..."}  oppure  ODL-001'
            multiline
            rows={3}
            helperText="Incolla il contenuto del QR code o inserisci il numero ODL"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrScanDialog(false)}>
            Annulla
          </Button>
          <Button
            variant="contained"
            onClick={handleQrScanConfirm}
            disabled={!scannedOdlCode.trim()}
          >
            Conferma Avanzamento
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}