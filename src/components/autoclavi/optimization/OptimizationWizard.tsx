'use client';

import { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Typography,
  Alert,
  Card,
  CardContent,
  Grid,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Chip,
  LinearProgress,
  Paper,
  Divider,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  NavigateNext,
  NavigateBefore,
  CheckCircle,
  Cancel,
  Info,
  Download,
  Visibility,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { enqueueSnackbar } from 'notistack';
import { ODLSelectionStep } from './ODLSelectionStep';
import { CycleAnalysisStep } from './CycleAnalysisStep';
import { ElevatedToolsStep } from './ElevatedToolsStep';
import { OptimizationResultsStep } from './OptimizationResultsStep';
import type { 
  CycleGroup, 
  ElevatedTool, 
  OptimizationResult,
  OptimizationConstraints 
} from '@/services/optimization-service';

interface OptimizationWizardProps {
  availableODLs: any[];
  availableAutoclaves: any[];
}

export function OptimizationWizard({ 
  availableODLs, 
  availableAutoclaves 
}: OptimizationWizardProps) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Selezione ODL e Autoclavi
  const [selectedODLs, setSelectedODLs] = useState<string[]>([]);
  const [selectedAutoclaves, setSelectedAutoclaves] = useState<string[]>([]);
  const [constraints, setConstraints] = useState<OptimizationConstraints>({
    min_border_distance: 50,
    min_tool_distance: 30,
    allow_rotation: true,
  });
  
  // Step 2: Analisi cicli
  const [cycleGroups, setCycleGroups] = useState<CycleGroup[]>([]);
  const [selectedCycles, setSelectedCycles] = useState<string[]>([]);
  
  // Step 3: Tool rialzati
  const [elevatedTools, setElevatedTools] = useState<ElevatedTool[]>([]);
  const [selectedElevatedTools, setSelectedElevatedTools] = useState<string[]>([]);
  
  // Step 4: Risultati
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [confirmedBatches, setConfirmedBatches] = useState<string[]>([]);

  const steps = [
    'Selezione ODL e Autoclavi',
    'Analisi Cicli di Cura',
    'Supporti Rialzati',
    'Risultati Ottimizzazione',
  ];

  const handleNext = async () => {
    if (activeStep === 0) {
      // Analizza cicli
      await analyzeCycles();
    } else if (activeStep === 1) {
      // Analizza supporti rialzati
      await analyzeElevatedTools();
    } else if (activeStep === 2) {
      // Esegui ottimizzazione
      await executeOptimization();
    } else if (activeStep === 3) {
      // Conferma batch
      await confirmBatches();
      return;
    }
    
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const analyzeCycles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/autoclavi/optimization/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          odlIds: selectedODLs,
          autoclaveIds: selectedAutoclaves,
          constraints,
        }),
      });

      if (!response.ok) throw new Error('Errore analisi cicli');

      const data = await response.json();
      setCycleGroups(data.cycle_groups);
      setSelectedCycles(data.recommendations);
    } catch (error) {
      enqueueSnackbar('Errore durante l\'analisi dei cicli', { variant: 'error' });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeElevatedTools = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/autoclavi/optimization/analyze-elevated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          odlIds: selectedODLs,
          autoclaveIds: selectedAutoclaves,
          constraints,
        }),
      });

      if (!response.ok) throw new Error('Errore analisi supporti');

      const data = await response.json();
      setElevatedTools(data.elevated_tools);
      
      // Pre-seleziona tool raccomandati
      const recommended = data.elevated_tools
        .filter((t: ElevatedTool) => t.recommendation === 'ELEVATE')
        .map((t: ElevatedTool) => t.tool_id);
      setSelectedElevatedTools(recommended);
    } catch (error) {
      enqueueSnackbar('Errore durante l\'analisi dei supporti rialzati', { variant: 'error' });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const executeOptimization = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/autoclavi/optimization/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          odlIds: selectedODLs,
          autoclaveIds: selectedAutoclaves,
          selectedCycles,
          elevatedTools: selectedElevatedTools,
          constraints,
        }),
      });

      if (!response.ok) throw new Error('Errore ottimizzazione');

      const data = await response.json();
      setOptimizationResult(data);
      
      // Pre-seleziona tutti i batch
      setConfirmedBatches(data.batches.map((b: any) => b.batch_id));
    } catch (error) {
      enqueueSnackbar('Errore durante l\'ottimizzazione', { variant: 'error' });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const confirmBatches = async () => {
    if (confirmedBatches.length === 0) {
      enqueueSnackbar('Seleziona almeno un batch da confermare', { variant: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const rejectedBatches = optimizationResult?.batches
        .filter(b => !confirmedBatches.includes(b.batch_id))
        .map(b => b.batch_id) || [];

      const response = await fetch('/api/autoclavi/optimization/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optimizationId: optimizationResult?.optimization_id,
          confirmedBatchIds: confirmedBatches,
          rejectedBatchIds: rejectedBatches,
        }),
      });

      if (!response.ok) throw new Error('Errore conferma batch');

      const data = await response.json();
      enqueueSnackbar(
        `${data.createdBatches} batch creati con successo`, 
        { variant: 'success' }
      );
      
      router.push('/autoclavi');
    } catch (error) {
      enqueueSnackbar('Errore durante la conferma dei batch', { variant: 'error' });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return selectedODLs.length > 0 && selectedAutoclaves.length > 0;
      case 1:
        return selectedCycles.length > 0;
      case 2:
        return true; // Supporti rialzati opzionali
      case 3:
        return confirmedBatches.length > 0;
      default:
        return false;
    }
  };

  return (
    <Box>
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
            <StepContent>
              <Box sx={{ mb: 2 }}>
                {index === 0 && (
                  <ODLSelectionStep
                    availableODLs={availableODLs}
                    availableAutoclaves={availableAutoclaves}
                    selectedODLs={selectedODLs}
                    setSelectedODLs={setSelectedODLs}
                    selectedAutoclaves={selectedAutoclaves}
                    setSelectedAutoclaves={setSelectedAutoclaves}
                    constraints={constraints}
                    setConstraints={setConstraints}
                  />
                )}
                
                {index === 1 && (
                  <CycleAnalysisStep
                    cycleGroups={cycleGroups}
                    selectedCycles={selectedCycles}
                    setSelectedCycles={setSelectedCycles}
                  />
                )}
                
                {index === 2 && (
                  <ElevatedToolsStep
                    elevatedTools={elevatedTools}
                    selectedElevatedTools={selectedElevatedTools}
                    setSelectedElevatedTools={setSelectedElevatedTools}
                  />
                )}
                
                {index === 3 && optimizationResult && (
                  <OptimizationResultsStep
                    result={optimizationResult}
                    confirmedBatches={confirmedBatches}
                    setConfirmedBatches={setConfirmedBatches}
                  />
                )}
              </Box>

              {loading && <LinearProgress sx={{ mb: 2 }} />}

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={loading || !canProceed()}
                  endIcon={index < steps.length - 1 ? <NavigateNext /> : <CheckCircle />}
                >
                  {index === steps.length - 1 ? 'Conferma' : 'Avanti'}
                </Button>
                
                {index > 0 && (
                  <Button
                    onClick={handleBack}
                    disabled={loading}
                    startIcon={<NavigateBefore />}
                  >
                    Indietro
                  </Button>
                )}
                
                <Button
                  onClick={() => router.push('/autoclavi')}
                  disabled={loading}
                  startIcon={<Cancel />}
                  color="inherit"
                >
                  Annulla
                </Button>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {activeStep === steps.length && (
        <Paper square elevation={0} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Ottimizzazione completata!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            I batch sono stati creati con successo. Verrai reindirizzato alla pagina autoclavi...
          </Typography>
        </Paper>
      )}
    </Box>
  );
}