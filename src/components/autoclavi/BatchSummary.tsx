'use client';

import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
} from '@mui/material';
import {
  LocalFireDepartment,
  Settings,
  Schedule,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

interface BatchSummaryProps {
  autoclave: any;
  curingCycle: any;
  selectedOdls: any[];
  plannedStart: Date;
  plannedEnd: Date;
  onPlannedStartChange: (date: Date) => void;
  onPlannedEndChange: (date: Date) => void;
}

export function BatchSummary({
  autoclave,
  curingCycle,
  selectedOdls,
  plannedStart,
  plannedEnd,
  onPlannedStartChange,
  onPlannedEndChange,
}: BatchSummaryProps) {
  const calculateTotalVolume = () => {
    return selectedOdls.reduce((sum, odl) => sum + (odl.estimatedVolume || 0), 0);
  };

  const calculateCapacityUtilization = () => {
    if (!autoclave) return 0;
    
    const totalVolume = calculateTotalVolume();
    const autoclaveVolume = autoclave.maxLength * autoclave.maxWidth * autoclave.maxHeight;
    
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

  const formatDuration = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    return `${hours}h`;
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

  const totalQuantity = selectedOdls.reduce((sum, odl) => sum + odl.quantity, 0);
  const totalVolume = calculateTotalVolume();
  const utilizationPercentage = calculateCapacityUtilization();
  const isOverCapacity = utilizationPercentage > 100;
  const autoclaveVolume = autoclave ? 
    autoclave.maxLength * autoclave.maxWidth * autoclave.maxHeight : 0;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Riepilogo Batch
      </Typography>

      {/* Informazioni Autoclave */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <LocalFireDepartment sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">
              Autoclave Selezionata
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <List dense>
                <ListItem disablePadding>
                  <ListItemText
                    primary="Nome"
                    secondary={autoclave?.name}
                  />
                </ListItem>
                <ListItem disablePadding>
                  <ListItemText
                    primary="Codice"
                    secondary={autoclave?.code}
                  />
                </ListItem>
                <ListItem disablePadding>
                  <ListItemText
                    primary="Dimensioni"
                    secondary={`${autoclave?.maxLength} × ${autoclave?.maxWidth} × ${autoclave?.maxHeight} cm`}
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <List dense>
                <ListItem disablePadding>
                  <ListItemText
                    primary="Volume"
                    secondary={formatVolume(autoclaveVolume)}
                  />
                </ListItem>
                <ListItem disablePadding>
                  <ListItemText
                    primary="Linee Vuoto"
                    secondary={`${autoclave?.vacuumLines} linee`}
                  />
                </ListItem>
                <ListItem disablePadding>
                  <ListItemText
                    primary="Utilizzo Previsto"
                    secondary={
                      <Box display="flex" alignItems="center">
                        <Typography 
                          variant="body2" 
                          color={isOverCapacity ? 'error.main' : 'success.main'}
                          sx={{ mr: 1 }}
                        >
                          {utilizationPercentage.toFixed(1)}%
                        </Typography>
                        {isOverCapacity && (
                          <Chip label="Sovraccarico" color="error" size="small" />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>

          {/* Barra utilizzo */}
          <Box mt={2}>
            <LinearProgress
              variant="determinate"
              value={Math.min(utilizationPercentage, 100)}
              color={isOverCapacity ? 'error' : 'success'}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Informazioni Ciclo di Cura */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <Settings sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">
              Ciclo di Cura
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <List dense>
                <ListItem disablePadding>
                  <ListItemText
                    primary="Nome"
                    secondary={curingCycle?.name}
                  />
                </ListItem>
                <ListItem disablePadding>
                  <ListItemText
                    primary="Durata"
                    secondary={formatDuration(curingCycle?.totalDuration || 0)}
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <List dense>
                <ListItem disablePadding>
                  <ListItemText
                    primary="Temperatura Max"
                    secondary={`${curingCycle?.maxTemperature || 'N/D'}°C`}
                  />
                </ListItem>
                <ListItem disablePadding>
                  <ListItemText
                    primary="Pressione Max"
                    secondary={`${curingCycle?.maxPressure || 'N/D'} bar`}
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
          
          {curingCycle?.description && (
            <Typography variant="body2" color="text.secondary" mt={1}>
              {curingCycle.description}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Pianificazione */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <Schedule sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">
              Pianificazione
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DateTimePicker
                label="Inizio Pianificato"
                value={plannedStart}
                onChange={(date) => date && onPlannedStartChange(date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DateTimePicker
                label="Fine Pianificata"
                value={plannedEnd}
                onChange={(date) => date && onPlannedEndChange(date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 2 }}>
            La fine pianificata si basa sulla durata del ciclo di cura selezionato. 
            Puoi modificarla manualmente se necessario.
          </Alert>
        </CardContent>
      </Card>

      {/* Lista ODL */}
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center">
              <Schedule sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                ODL Selezionati ({selectedOdls.length})
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Quantità totale: {totalQuantity} pz
            </Typography>
          </Box>

          {isOverCapacity && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Attenzione: Il volume totale degli ODL supera la capacità dell'autoclave
            </Alert>
          )}

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ODL</TableCell>
                  <TableCell>Pezzo</TableCell>
                  <TableCell align="center">Qta</TableCell>
                  <TableCell align="center">Priorità</TableCell>
                  <TableCell align="center">Dimensioni</TableCell>
                  <TableCell align="right">Volume</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedOdls.map((odl) => (
                  <TableRow key={odl.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {odl.odlNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {odl.partNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {odl.partDescription}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {odl.quantity}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={odl.priority}
                        size="small"
                        color={getPriorityColor(odl.priority) as any}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="caption">
                        {formatDimensions(odl.dimensions)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatVolume(odl.estimatedVolume)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell colSpan={2}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      TOTALE
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="subtitle2" fontWeight="bold">
                      {totalQuantity}
                    </Typography>
                  </TableCell>
                  <TableCell colSpan={2}></TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" fontWeight="bold">
                      {formatVolume(totalVolume)}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}