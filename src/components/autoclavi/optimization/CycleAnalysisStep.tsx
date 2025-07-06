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
  LinearProgress,
  Alert,
  Paper,
  Button,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  Info,
  CheckCircle,
  RadioButtonUnchecked,
} from '@mui/icons-material';
import type { CycleGroup } from '@/services/optimization-service';

interface CycleAnalysisStepProps {
  cycleGroups: CycleGroup[];
  selectedCycles: string[];
  setSelectedCycles: (cycles: string[]) => void;
}

export function CycleAnalysisStep({
  cycleGroups,
  selectedCycles,
  setSelectedCycles,
}: CycleAnalysisStepProps) {
  const handleCycleToggle = (cycleCode: string) => {
    setSelectedCycles(
      selectedCycles.includes(cycleCode)
        ? selectedCycles.filter(c => c !== cycleCode)
        : [...selectedCycles, cycleCode]
    );
  };

  const handleSelectRecommended = () => {
    const recommended = cycleGroups
      .filter(g => g.optimization_score > 0.6)
      .map(g => g.cycle_code);
    setSelectedCycles(recommended);
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'error';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Ottimo';
    if (score >= 0.6) return 'Buono';
    if (score >= 0.4) return 'Sufficiente';
    return 'Scarso';
  };

  // Ordina per score decrescente
  const sortedGroups = [...cycleGroups].sort((a, b) => b.optimization_score - a.optimization_score);

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Il sistema ha analizzato i cicli di cura disponibili e calcolato un punteggio di ottimizzazione
          basato su quantità, uniformità dimensionale e densità dei pezzi.
        </Typography>
      </Alert>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">
          Cicli di Cura Disponibili
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<CheckCircle />}
          onClick={handleSelectRecommended}
        >
          Seleziona Consigliati
        </Button>
      </Box>

      <Grid container spacing={2}>
        {sortedGroups.map((group) => {
          const isSelected = selectedCycles.includes(group.cycle_code);
          const isRecommended = group.optimization_score > 0.6;
          
          return (
            <Grid size={{ xs: 12, md: 6 }} key={group.cycle_code}>
              <Card 
                variant={isSelected ? 'elevation' : 'outlined'}
                sx={{ 
                  position: 'relative',
                  border: isSelected ? 2 : 1,
                  borderColor: isSelected ? 'primary.main' : 'divider',
                }}
              >
                {isRecommended && (
                  <Chip
                    label="CONSIGLIATO"
                    color="primary"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                    }}
                  />
                )}

                <CardContent>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleCycleToggle(group.cycle_code)}
                        icon={<RadioButtonUnchecked />}
                        checkedIcon={<CheckCircle />}
                      />
                    }
                    label={
                      <Typography variant="h6" component="span">
                        {group.cycle_code}
                      </Typography>
                    }
                  />

                  <Stack spacing={2} sx={{ mt: 2 }}>
                    {/* Score di ottimizzazione */}
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          Score Ottimizzazione
                        </Typography>
                        <Chip
                          label={getScoreLabel(group.optimization_score)}
                          color={getScoreColor(group.optimization_score)}
                          size="small"
                        />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={group.optimization_score * 100}
                        color={getScoreColor(group.optimization_score)}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>

                    {/* Metriche */}
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                          <Typography variant="h5" color="primary">
                            {group.odl_count}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ODL
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6}>
                        <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                          <Typography variant="h5" color="primary">
                            {(group.total_area / 1000000).toFixed(1)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            m² totali
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>

                    {/* Lista ODL */}
                    <Box>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        ODL inclusi:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {group.odl_ids.slice(0, 5).map((odlId) => (
                          <Chip
                            key={odlId}
                            label={odlId.substring(0, 8) + '...'}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {group.odl_ids.length > 5 && (
                          <Chip
                            label={`+${group.odl_ids.length - 5} altri`}
                            size="small"
                            variant="filled"
                            color="default"
                          />
                        )}
                      </Box>
                    </Box>
                  </Stack>
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Tooltip title="Maggiori informazioni sul punteggio">
                    <Button size="small" startIcon={<Info />}>
                      Score: {(group.optimization_score * 100).toFixed(0)}%
                    </Button>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {cycleGroups.length === 0 && (
        <Alert severity="warning">
          Nessun ciclo di cura trovato. Verifica la selezione degli ODL.
        </Alert>
      )}

      {selectedCycles.length > 0 && (
        <Alert severity="success" sx={{ mt: 3 }}>
          <Typography variant="body2">
            {selectedCycles.length} cicli selezionati per l'ottimizzazione
          </Typography>
        </Alert>
      )}
    </Box>
  );
}