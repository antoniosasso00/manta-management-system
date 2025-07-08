'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Tab,
  Tabs,
  Button,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add, Refresh } from '@mui/icons-material';
import { BatchCard } from '@/components/autoclavi/BatchCard';
import { useSnackbar } from 'notistack';

interface BatchData {
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
}

const statusTabs = [
  { value: 'DRAFT', label: 'Bozze', color: 'default' },
  { value: 'READY', label: 'Pronti', color: 'info' },
  { value: 'IN_CURE', label: 'In Cura', color: 'warning' },
  { value: 'COMPLETED', label: 'Completati', color: 'success' },
  { value: 'RELEASED', label: 'Rilasciati', color: 'primary' },
];

export default function BatchesPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  
  const [activeTab, setActiveTab] = useState(0);
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/autoclavi/batches');
      if (!response.ok) throw new Error('Errore caricamento batch');
      
      const data = await response.json();
      setBatches(data.batches || []);
    } catch (error) {
      console.error('Errore fetch batch:', error);
      setError('Errore nel caricamento dei batch');
      enqueueSnackbar('Errore nel caricamento dei batch', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleBatchAdvance = async (batchId: string, targetStatus: string, scannedOdlId?: string) => {
    try {
      const response = await fetch('/api/autoclavi/batches/advance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batchId,
          targetStatus,
          scannedOdlId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        enqueueSnackbar(data.message, { variant: 'success' });
        fetchBatches(); // Ricarica i batch
      } else {
        throw new Error(data.error || 'Errore avanzamento batch');
      }
    } catch (error) {
      console.error('Errore avanzamento batch:', error);
      enqueueSnackbar(
        error instanceof Error ? error.message : 'Errore avanzamento batch',
        { variant: 'error' }
      );
    }
  };

  const handleBatchDelete = async (batchId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo batch? Gli ODL verranno ripristinati al loro stato precedente.')) {
      return;
    }

    try {
      const response = await fetch(`/api/autoclavi/batches/${batchId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        enqueueSnackbar(data.message, { variant: 'success' });
        fetchBatches(); // Ricarica i batch
      } else {
        throw new Error(data.error || 'Errore eliminazione batch');
      }
    } catch (error) {
      console.error('Errore eliminazione batch:', error);
      enqueueSnackbar(
        error instanceof Error ? error.message : 'Errore eliminazione batch',
        { variant: 'error' }
      );
    }
  };

  const getCurrentStatusBatches = () => {
    const currentStatus = statusTabs[activeTab]?.value;
    return batches.filter(batch => batch.status === currentStatus);
  };

  const getBatchCountByStatus = (status: string) => {
    return batches.filter(batch => batch.status === status).length;
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow = ['DRAFT', 'READY', 'IN_CURE', 'COMPLETED', 'RELEASED'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    return currentIndex >= 0 && currentIndex < statusFlow.length - 1 
      ? statusFlow[currentIndex + 1] 
      : null;
  };

  const currentBatches = getCurrentStatusBatches();

  return (
    <Container maxWidth="lg">
      <Box py={3}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Gestione Batch Autoclavi
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchBatches}
              disabled={loading}
            >
              Aggiorna
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => router.push('/dashboard/autoclavi/create-batch')}
            >
              Nuovo Batch
            </Button>
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Status Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            {statusTabs.map((tab, index) => (
              <Tab
                key={tab.value}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    {tab.label}
                    <Box
                      component="span"
                      sx={{
                        bgcolor: `${tab.color}.main`,
                        color: 'white',
                        borderRadius: '50%',
                        minWidth: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {getBatchCountByStatus(tab.value)}
                    </Box>
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Box>

        {/* Content */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : currentBatches.length === 0 ? (
          <Alert severity="info">
            Nessun batch in stato &quot;{statusTabs[activeTab]?.label.toLowerCase()}&quot;
            {activeTab === 0 && (
              <Box mt={1}>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => router.push('/dashboard/autoclavi/create-batch')}
                  size="small"
                >
                  Crea il primo batch
                </Button>
              </Box>
            )}
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {currentBatches.map((batch) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={batch.id}>
                <BatchCard
                  batch={batch}
                  onAdvance={(targetStatus, scannedOdlId) => 
                    handleBatchAdvance(batch.id, targetStatus, scannedOdlId)
                  }
                  onDelete={() => handleBatchDelete(batch.id)}
                  onEdit={() => router.push(`/dashboard/autoclavi/batches/${batch.id}/edit`)}
                  onViewDetails={() => router.push(`/dashboard/autoclavi/batches/${batch.id}`)}
                  nextStatus={getNextStatus(batch.status)}
                  canModify={['DRAFT', 'READY', 'IN_CURE', 'COMPLETED'].includes(batch.status)}
                  canDelete={['DRAFT', 'READY'].includes(batch.status)}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Summary Stats */}
        {!loading && batches.length > 0 && (
          <Box mt={4} p={3} bgcolor="background.paper" borderRadius={2}>
            <Typography variant="h6" gutterBottom>
              Riepilogo
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Batch Totali
                </Typography>
                <Typography variant="h5">
                  {batches.length}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  In Lavorazione
                </Typography>
                <Typography variant="h5" color="warning.main">
                  {getBatchCountByStatus('IN_CURE')}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Completati Oggi
                </Typography>
                <Typography variant="h5" color="success.main">
                  {batches.filter(b => {
                    if (b.status !== 'COMPLETED' || !b.actualEnd) return false;
                    const today = new Date().toDateString();
                    return new Date(b.actualEnd).toDateString() === today;
                  }).length}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  ODL Totali
                </Typography>
                <Typography variant="h5">
                  {batches.reduce((sum, batch) => sum + batch.odlCount, 0)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>
    </Container>
  );
}