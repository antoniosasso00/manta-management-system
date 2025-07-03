'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { AutoclaveSelection } from '@/components/autoclavi/AutoclaveSelection';
import { OdlSelection } from '@/components/autoclavi/OdlSelection';
import { BatchSummary } from '@/components/autoclavi/BatchSummary';
import { useSnackbar } from 'notistack';

interface SelectedAutoclave {
  id: string;
  code: string;
  name: string;
  maxLength: number;
  maxWidth: number;
  maxHeight: number;
  vacuumLines: number;
  curingCycles: Array<{
    id: string;
    name: string;
    description?: string;
    totalDuration: number;
  }>;
}

interface SelectedOdl {
  id: string;
  odlNumber: string;
  partNumber: string;
  partDescription: string;
  quantity: number;
  priority: string;
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
  };
  estimatedVolume: number;
}

const steps = ['Selezione Autoclave', 'Selezione ODL', 'Riepilogo', 'Conferma'];

export default function CreateBatchPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  
  const [activeStep, setActiveStep] = useState(0);
  const [selectedAutoclave, setSelectedAutoclave] = useState<SelectedAutoclave | null>(null);
  const [selectedCuringCycle, setSelectedCuringCycle] = useState<string>('');
  const [selectedOdls, setSelectedOdls] = useState<SelectedOdl[]>([]);
  const [plannedStart, setPlannedStart] = useState<Date>(new Date());
  const [plannedEnd, setPlannedEnd] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Calcola fine pianificata quando cambia ciclo o inizio
  useEffect(() => {
    if (selectedCuringCycle && selectedAutoclave) {
      const cycle = selectedAutoclave.curingCycles.find(c => c.id === selectedCuringCycle);
      if (cycle) {
        const endDate = new Date(plannedStart);
        endDate.setHours(endDate.getHours() + cycle.totalDuration);
        setPlannedEnd(endDate);
      }
    }
  }, [selectedCuringCycle, plannedStart, selectedAutoclave]);

  const handleNext = () => {
    setError('');
    
    switch (activeStep) {
      case 0: // Validazione selezione autoclave
        if (!selectedAutoclave || !selectedCuringCycle) {
          setError('Seleziona autoclave e ciclo di cura');
          return;
        }
        break;
      case 1: // Validazione selezione ODL
        if (selectedOdls.length === 0) {
          setError('Seleziona almeno un ODL');
          return;
        }
        break;
      case 2: // Validazione riepilogo
        if (!plannedStart || !plannedEnd) {
          setError('Imposta date di pianificazione');
          return;
        }
        break;
    }
    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleCreateBatch = async () => {
    if (!selectedAutoclave || !selectedCuringCycle || selectedOdls.length === 0) {
      setError('Dati mancanti per la creazione del batch');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/autoclavi/batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          autoclaveId: selectedAutoclave.id,
          curingCycleId: selectedCuringCycle,
          plannedStart: plannedStart.toISOString(),
          plannedEnd: plannedEnd.toISOString(),
          odlIds: selectedOdls.map(odl => odl.id),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        enqueueSnackbar(data.message || 'Batch creato con successo', { variant: 'success' });
        router.push('/dashboard/autoclavi/batches');
      } else {
        throw new Error(data.error || 'Errore nella creazione del batch');
      }
    } catch (error) {
      console.error('Errore creazione batch:', error);
      setError(error instanceof Error ? error.message : 'Errore sconosciuto');
      enqueueSnackbar('Errore nella creazione del batch', { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <AutoclaveSelection
            selectedAutoclave={selectedAutoclave}
            selectedCuringCycle={selectedCuringCycle}
            onAutoclaveSelect={setSelectedAutoclave}
            onCuringCycleSelect={setSelectedCuringCycle}
          />
        );
      case 1:
        return (
          <OdlSelection
            curingCycleId={selectedCuringCycle}
            selectedOdls={selectedOdls}
            onOdlsSelect={setSelectedOdls}
            autoclaveCapacity={selectedAutoclave ? {
              maxLength: selectedAutoclave.maxLength,
              maxWidth: selectedAutoclave.maxWidth,
              maxHeight: selectedAutoclave.maxHeight,
            } : undefined}
          />
        );
      case 2:
        return (
          <BatchSummary
            autoclave={selectedAutoclave}
            curingCycle={selectedAutoclave?.curingCycles.find(c => c.id === selectedCuringCycle)}
            selectedOdls={selectedOdls}
            plannedStart={plannedStart}
            plannedEnd={plannedEnd}
            onPlannedStartChange={setPlannedStart}
            onPlannedEndChange={setPlannedEnd}
          />
        );
      case 3:
        return (
          <Box textAlign="center" py={4}>
            <Typography variant="h5" gutterBottom>
              Conferma Creazione Batch
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Batch: <strong>{selectedAutoclave?.name}</strong>
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              ODL selezionati: <strong>{selectedOdls.length}</strong>
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Inizio pianificato: <strong>{plannedStart.toLocaleString()}</strong>
            </Typography>
            
            {isLoading && (
              <Box mt={2}>
                <CircularProgress />
                <Typography variant="body2" mt={1}>
                  Creazione batch in corso...
                </Typography>
              </Box>
            )}
          </Box>
        );
      default:
        return <div>Passo sconosciuto</div>;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box py={3}>
        {/* Header */}
        <Box display="flex" alignItems="center" mb={3}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.push('/dashboard/autoclavi/batches')}
            sx={{ mr: 2 }}
          >
            Indietro
          </Button>
          <Typography variant="h4" component="h1">
            Crea Nuovo Batch
          </Typography>
        </Box>

        {/* Stepper */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Step Content */}
        <Paper sx={{ p: 3, mb: 3 }}>
          {renderStepContent(activeStep)}
        </Paper>

        {/* Navigation Buttons */}
        <Box display="flex" justifyContent="space-between">
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            size="large"
          >
            Indietro
          </Button>
          
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleCreateBatch}
                disabled={isLoading}
                size="large"
              >
                {isLoading ? 'Creazione...' : 'Crea Batch'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                size="large"
              >
                Avanti
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Container>
  );
}