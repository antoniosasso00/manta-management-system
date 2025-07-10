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
  useTheme,
  useMediaQuery,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Visibility,
  LocalFireDepartment,
  Speed,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { enqueueSnackbar } = useSnackbar();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<BatchLayout | null>(null);
  const [filterEfficiency, setFilterEfficiency] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'efficiency' | 'odl_count' | 'autoclave'>('efficiency');

  const handleBatchToggle = (batchId: string) => {
    setConfirmedBatches(
      confirmedBatches.includes(batchId)
        ? confirmedBatches.filter(id => id !== batchId)
        : [...confirmedBatches, batchId]
    );
  };
  
  const handleSelectAll = () => {
    const visibleBatchIds = getFilteredBatches().map(b => b.batch_id);
    setConfirmedBatches(visibleBatchIds);
  };
  
  const handleDeselectAll = () => {
    setConfirmedBatches([]);
  };
  
  const handleSelectRecommended = () => {
    const recommendedBatches = result.batches.filter(b => 
      b.metrics.area_efficiency >= 0.7
    ).map(b => b.batch_id);
    setConfirmedBatches(recommendedBatches);
  };

  const handleViewLayout = (batch: BatchLayout) => {
    setSelectedBatch(batch);
    setViewerOpen(true);
  };

  const getFilteredBatches = () => {
    let filtered = [...result.batches];
    
    // Filtra per efficienza
    switch (filterEfficiency) {
      case 'high':
        filtered = filtered.filter(b => b.metrics.area_efficiency >= 0.8);
        break;
      case 'medium':
        filtered = filtered.filter(b => b.metrics.area_efficiency >= 0.6 && b.metrics.area_efficiency < 0.8);
        break;
      case 'low':
        filtered = filtered.filter(b => b.metrics.area_efficiency < 0.6);
        break;
    }
    
    // Ordina
    switch (sortBy) {
      case 'efficiency':
        filtered.sort((a, b) => b.metrics.area_efficiency - a.metrics.area_efficiency);
        break;
      case 'odl_count':
        filtered.sort((a, b) => b.metrics.odl_count - a.metrics.odl_count);
        break;
      case 'autoclave':
        filtered.sort((a, b) => a.autoclave_code.localeCompare(b.autoclave_code));
        break;
    }
    
    return filtered;
  };
  
  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 0.8) return 'success';
    if (efficiency >= 0.6) return 'warning';
    return 'error';
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

      {/* Controlli filtri e azioni batch */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Filtra per efficienza</InputLabel>
              <Select
                value={filterEfficiency}
                onChange={(e) => setFilterEfficiency(e.target.value as any)}
                label="Filtra per efficienza"
              >
                <MenuItem value="all">Tutti i batch</MenuItem>
                <MenuItem value="high">Alta efficienza (≥ 80%)</MenuItem>
                <MenuItem value="medium">Media efficienza (60-79%)</MenuItem>
                <MenuItem value="low">Bassa efficienza (&lt; 60%)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Ordina per</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                label="Ordina per"
              >
                <MenuItem value="efficiency">Efficienza</MenuItem>
                <MenuItem value="odl_count">Numero ODL</MenuItem>
                <MenuItem value="autoclave">Autoclave</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, md: 5 }}>
            <Stack direction={isMobile ? "column" : "row"} spacing={1}>
              <Button
                size="small"
                variant="outlined"
                onClick={handleSelectAll}
                fullWidth={isMobile}
              >
                Seleziona tutti
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={handleDeselectAll}
                fullWidth={isMobile}
              >
                Deseleziona tutti
              </Button>
              <Button
                size="small"
                variant="contained"
                color="success"
                onClick={handleSelectRecommended}
                startIcon={<CheckCircle />}
                fullWidth={isMobile}
              >
                Solo consigliati
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Lista Batch */}
      <Typography variant="h6" gutterBottom>
        Batch Ottimizzati ({getFilteredBatches().length} di {result.batches.length})
      </Typography>
      
      <Grid container spacing={2}>
        {getFilteredBatches().map((batch) => {
          const isConfirmed = confirmedBatches.includes(batch.batch_id);
          const efficiency = batch.metrics.area_efficiency;
          const efficiencyColor = getEfficiencyColor(efficiency);
          
          return (
            <Grid size={{ xs: 12, lg: 6 }} key={batch.batch_id}>
              <Card
                variant={isConfirmed ? 'elevation' : 'outlined'}
                sx={{
                  border: isConfirmed ? 2 : 1,
                  borderColor: isConfirmed ? 'primary.main' : 'divider',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardContent sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Checkbox
                        checked={isConfirmed}
                        onChange={() => handleBatchToggle(batch.batch_id)}
                        checkedIcon={<CheckCircle />}
                      />
                      <LocalFireDepartment color="primary" />
                      <Typography variant="h6" component="span">
                        {batch.autoclave_code}
                      </Typography>
                      <Chip
                        label={batch.curing_cycle}
                        color="primary"
                        size="small"
                      />
                      <Chip
                        label={`${(efficiency * 100).toFixed(0)}%`}
                        color={efficiencyColor}
                        size="small"
                        variant="outlined"
                        icon={<Speed />}
                      />
                    </Box>
                    
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Visualizza layout">
                        <IconButton size="small" onClick={() => handleViewLayout(batch)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Esporta PDF">
                        <IconButton size="small" onClick={() => handleExportPDF(batch.batch_id)}>
                          <PictureAsPdf fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Esporta DXF">
                        <IconButton size="small" onClick={() => handleExportDXF(batch.batch_id)}>
                          <Architecture fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>

                  {/* Metriche batch */}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Paper variant="outlined" sx={{ p: 1, textAlign: 'center', height: '100%' }}>
                        <Typography variant="h5" color={`${efficiencyColor}.main`}>
                          {(efficiency * 100).toFixed(0)}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Efficienza
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Paper variant="outlined" sx={{ p: 1, textAlign: 'center', height: '100%' }}>
                        <Typography variant="h5">
                          {batch.metrics.total_weight.toFixed(0)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          kg totali
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Paper variant="outlined" sx={{ p: 1, textAlign: 'center', height: '100%' }}>
                        <Typography variant="h5">
                          {batch.metrics.vacuum_lines_used}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Linee vuoto
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Paper variant="outlined" sx={{ p: 1, textAlign: 'center', height: '100%' }}>
                        <Typography variant="h5">
                          {batch.metrics.odl_count}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ODL ({batch.metrics.tool_count} tool)
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  {/* Lista ODL nel batch */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {[...new Set(batch.placements.map(p => p.odl_number))]
                      .slice(0, isMobile ? 3 : 6)
                      .map((odlNumber) => (
                        <Chip
                          key={odlNumber}
                          label={odlNumber}
                          size="small"
                          variant="outlined"
                        />
                      ))
                    }
                    {[...new Set(batch.placements.map(p => p.odl_number))].length > (isMobile ? 3 : 6) && (
                      <Chip
                        label={`+${[...new Set(batch.placements.map(p => p.odl_number))].length - (isMobile ? 3 : 6)} altri`}
                        size="small"
                        variant="filled"
                        color="default"
                      />
                    )}
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
        fullScreen={isMobile}
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