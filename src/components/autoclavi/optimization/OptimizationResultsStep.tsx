'use client';

import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Checkbox,
  FormControlLabel,
  Chip,
  Stack,
  Alert,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Download,
  Visibility,
  LocalFireDepartment,
  Speed,
  Scale,
  AirlineSeatFlat,
  PictureAsPdf,
  Architecture,
} from '@mui/icons-material';
import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { BatchLayoutViewer } from './BatchLayoutViewer';
import type { OptimizationResult, BatchLayout } from '@/services/optimization-service';

interface OptimizationResultsStepProps {
  result: OptimizationResult;
  confirmedBatches: string[];
  setConfirmedBatches: (batches: string[]) => void;
}

export function OptimizationResultsStep({
  result,
  confirmedBatches,
  setConfirmedBatches,
}: OptimizationResultsStepProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<BatchLayout | null>(null);

  const handleBatchToggle = (batchId: string) => {
    setConfirmedBatches(
      confirmedBatches.includes(batchId)
        ? confirmedBatches.filter(id => id !== batchId)
        : [...confirmedBatches, batchId]
    );
  };

  const handleViewLayout = (batch: BatchLayout) => {
    setSelectedBatch(batch);
    setViewerOpen(true);
  };

  const handleExportPDF = async (batchId: string) => {
    try {
      const response = await fetch(`/api/autoclavi/optimization/batch/${batchId}/export/pdf`);
      if (!response.ok) throw new Error('Errore export PDF');
      
      const data = await response.json();
      
      // Crea link per download
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${data.content_base64}`;
      link.download = data.filename;
      link.click();
      
      enqueueSnackbar('PDF esportato con successo', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Errore durante l\'export PDF', { variant: 'error' });
      console.error(error);
    }
  };

  const handleExportDXF = async (batchId: string) => {
    try {
      const response = await fetch(`/api/autoclavi/optimization/batch/${batchId}/export/dxf`);
      if (!response.ok) throw new Error('Errore export DXF');
      
      const data = await response.json();
      
      // Crea link per download
      const blob = new Blob([data.content], { type: 'application/dxf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      link.click();
      URL.revokeObjectURL(url);
      
      enqueueSnackbar('DXF esportato con successo', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Errore durante l\'export DXF', { variant: 'error' });
      console.error(error);
    }
  };

  return (
    <Box>
      {/* Statistiche generali */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">
              {result.total_odls_placed}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ODL Posizionati
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">
              {result.batches.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Batch Creati
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {(result.success_rate * 100).toFixed(0)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tasso di Successo
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">
              {result.execution_time_seconds.toFixed(1)}s
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tempo di Calcolo
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Lista Batch */}
      <Typography variant="h6" gutterBottom>
        Batch Ottimizzati
      </Typography>
      
      <Grid container spacing={2}>
        {result.batches.map((batch) => {
          const isConfirmed = confirmedBatches.includes(batch.batch_id);
          
          return (
            <Grid size={12} key={batch.batch_id}>
              <Card
                variant={isConfirmed ? 'elevation' : 'outlined'}
                sx={{
                  border: isConfirmed ? 2 : 1,
                  borderColor: isConfirmed ? 'primary.main' : 'divider',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isConfirmed}
                          onChange={() => handleBatchToggle(batch.batch_id)}
                          checkedIcon={<CheckCircle />}
                        />
                      }
                      label={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <LocalFireDepartment color="primary" />
                          <Typography variant="h6">
                            Autoclave {batch.autoclave_code}
                          </Typography>
                          <Chip
                            label={batch.curing_cycle}
                            color="primary"
                            size="small"
                          />
                        </Stack>
                      }
                    />
                    
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Visualizza layout">
                        <IconButton onClick={() => handleViewLayout(batch)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Esporta PDF">
                        <IconButton onClick={() => handleExportPDF(batch.batch_id)}>
                          <PictureAsPdf />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Esporta DXF">
                        <IconButton onClick={() => handleExportDXF(batch.batch_id)}>
                          <Architecture />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>

                  {/* Metriche batch */}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Speed fontSize="small" color="action" />
                        <Box>
                          <Typography variant="h6">
                            {(batch.metrics.area_efficiency * 100).toFixed(1)}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Efficienza
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Scale fontSize="small" color="action" />
                        <Box>
                          <Typography variant="h6">
                            {batch.metrics.total_weight.toFixed(0)} kg
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Peso Totale
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AirlineSeatFlat fontSize="small" color="action" />
                        <Box>
                          <Typography variant="h6">
                            {batch.metrics.vacuum_lines_used}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Linee Vuoto
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Box>
                        <Typography variant="h6">
                          {batch.metrics.odl_count}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ODL ({batch.metrics.tool_count} tool)
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  {/* Lista ODL nel batch */}
                  <Typography variant="subtitle2" gutterBottom>
                    ODL inclusi nel batch:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {[...new Set(batch.placements.map(p => p.odl_number))].map((odlNumber) => (
                      <Chip
                        key={odlNumber}
                        label={odlNumber}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
                  {isConfirmed ? (
                    <Chip
                      icon={<CheckCircle />}
                      label="Batch confermato"
                      color="success"
                      variant="filled"
                    />
                  ) : (
                    <Chip
                      icon={<Cancel />}
                      label="Batch non confermato"
                      color="default"
                      variant="outlined"
                    />
                  )}
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Riepilogo conferma */}
      <Alert 
        severity={confirmedBatches.length > 0 ? "success" : "warning"}
        sx={{ mt: 3 }}
      >
        <Typography variant="body2">
          {confirmedBatches.length} batch su {result.batches.length} selezionati per la conferma
        </Typography>
      </Alert>

      {/* Dialog visualizzatore layout */}
      <Dialog
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Layout Batch - {selectedBatch?.autoclave_code}
        </DialogTitle>
        <DialogContent>
          {selectedBatch && (
            <BatchLayoutViewer batch={selectedBatch} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewerOpen(false)}>
            Chiudi
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}