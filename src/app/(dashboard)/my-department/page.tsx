'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  LinearProgress,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem
} from '@mui/material';
import {
  Dashboard,
  AssignmentTurnedIn,
  Schedule,
  TrendingUp,
  QrCodeScanner,
  PlayArrow,
  Edit,
  Refresh,
  Add
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ODLStatus, EventType } from '@prisma/client';

interface DashboardKPI {
  odlToday: number;
  odlCompleted: number;
  averageTime: number;
  efficiency: number;
}

interface ODLItem {
  id: string;
  odlNumber: string;
  partNumber: string;
  description: string;
  status: ODLStatus;
  priority: string;
  quantity: number;
  currentDepartment?: string;
  timeInDepartment?: number;
  isActive?: boolean;
  lastEvent?: {
    eventType: EventType;
    timestamp: string;
  };
}

interface ChartData {
  date: string;
  completedODL: number;
  day: string;
}

export default function MyDepartmentPage() {
  const { user } = useAuth();
  const [kpi, setKpi] = useState<DashboardKPI>({ odlToday: 0, odlCompleted: 0, averageTime: 0, efficiency: 0 });
  const [myODL, setMyODL] = useState<ODLItem[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; odl: ODLItem | null }>({ open: false, odl: null });
  const [newStatus, setNewStatus] = useState<ODLStatus | ''>('');

  useEffect(() => {
    loadDashboardData();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Carica KPI
      await Promise.all([
        loadKPIData(),
        loadMyODL(),
        loadChartData()
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadKPIData = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/production/dashboard/kpi?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setKpi(data);
      } else {
        console.error('Error loading KPI:', response.statusText);
        setKpi({
          odlToday: 0,
          odlCompleted: 0,
          averageTime: 0,
          efficiency: 0
        });
      }
    } catch (error) {
      console.error('Error loading KPI:', error);
      setKpi({
        odlToday: 0,
        odlCompleted: 0,
        averageTime: 0,
        efficiency: 0
      });
    }
  };

  const loadMyODL = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/production/odl/my-assignments?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setMyODL(data);
      } else {
        console.error('Error loading my ODL:', response.statusText);
        setMyODL([]);
      }
    } catch (error) {
      console.error('Error loading my ODL:', error);
      setMyODL([]);
    }
  };

  const loadChartData = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/production/dashboard/chart?userId=${user.id}&days=7`);
      if (response.ok) {
        const data = await response.json();
        setChartData(data);
      } else {
        console.error('Error loading chart data:', response.statusText);
        setChartData([]);
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
      setChartData([]);
    }
  };

  const handleStatusChange = async () => {
    if (!statusDialog.odl || !newStatus) return;

    try {
      const response = await fetch(`/api/odl/${statusDialog.odl.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await loadMyODL();
        setStatusDialog({ open: false, odl: null });
        setNewStatus('');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const openStatusDialog = (odl: ODLItem) => {
    setStatusDialog({ open: true, odl });
    setNewStatus(odl.status);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status: ODLStatus) => {
    switch (status) {
      case 'IN_CLEANROOM':
      case 'IN_AUTOCLAVE':
      case 'IN_NDI':
      case 'IN_RIFILATURA':
        return 'primary';
      case 'CLEANROOM_COMPLETED':
      case 'AUTOCLAVE_COMPLETED':
        return 'success';
      case 'COMPLETED':
        return 'success';
      case 'ON_HOLD':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box className="p-4">
        <LinearProgress />
        <Typography className="mt-4 text-center">Caricamento dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box className="p-4 space-y-6">
      {/* Header */}
      <Box className="flex items-center justify-between">
        <Typography variant="h4" className="flex items-center gap-2">
          <Dashboard />
          Il Mio Reparto
        </Typography>
        <Box className="space-x-2">
          <Button
            variant="outlined"
            startIcon={<QrCodeScanner />}
            href="/dashboard/qr-scanner"
          >
            Scanner QR
          </Button>
          <IconButton onClick={loadDashboardData}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Box className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <Card>
            <CardContent>
              <Box className="flex items-center justify-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    ODL Oggi
                  </Typography>
                  <Typography variant="h4">
                    {kpi.odlToday}
                  </Typography>
                </Box>
                <AssignmentTurnedIn color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box className="flex items-center justify-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Completati
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {kpi.odlCompleted}
                  </Typography>
                </Box>
                <AssignmentTurnedIn color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box className="flex items-center justify-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Tempo Medio
                  </Typography>
                  <Typography variant="h4">
                    {formatTime(kpi.averageTime)}
                  </Typography>
                </Box>
                <Schedule color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box className="flex items-center justify-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Efficienza
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {kpi.efficiency}%
                  </Typography>
                </Box>
                <TrendingUp color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
      </Box>

      {/* Chart */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ODL Completati - Ultimi 7 Giorni
          </Typography>
          <Box className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip 
                  labelFormatter={(label) => `Giorno: ${label}`}
                  formatter={(value) => [value, 'ODL Completati']}
                />
                <Bar dataKey="completedODL" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* My ODL Table */}
      <Card>
        <CardContent>
          <Box className="flex items-center justify-between mb-4">
            <Typography variant="h6">
              I Miei ODL Assegnati
            </Typography>
            <Button startIcon={<Add />} variant="outlined">
              Nuovo ODL
            </Button>
          </Box>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ODL</TableCell>
                  <TableCell>Parte</TableCell>
                  <TableCell>Stato</TableCell>
                  <TableCell>Priorità</TableCell>
                  <TableCell>Tempo</TableCell>
                  <TableCell>Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {myODL.map((odl) => (
                  <TableRow key={odl.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {odl.odlNumber}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Qtà: {odl.quantity}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {odl.partNumber}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {odl.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={odl.status.replace('_', ' ')}
                        color={getStatusColor(odl.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={odl.priority}
                        color={getPriorityColor(odl.priority)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {odl.isActive && odl.timeInDepartment ? (
                        <Box className="flex items-center gap-1">
                          <PlayArrow color="success" fontSize="small" />
                          <Typography variant="body2" color="success.main">
                            {formatTime(odl.timeInDepartment)}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          Non attivo
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => openStatusDialog(odl)}
                      >
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                
                {myODL.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="textSecondary">
                        Nessun ODL assegnato
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Status Change Dialog */}
      <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ open: false, odl: null })}>
        <DialogTitle>
          Cambia Stato ODL {statusDialog.odl?.odlNumber}
        </DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Nuovo Stato"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as ODLStatus)}
            margin="normal"
          >
            <MenuItem value="CREATED">Creato</MenuItem>
            <MenuItem value="IN_CLEANROOM">In Clean Room</MenuItem>
            <MenuItem value="CLEANROOM_COMPLETED">Clean Room Completato</MenuItem>
            <MenuItem value="IN_AUTOCLAVE">In Autoclavi</MenuItem>
            <MenuItem value="AUTOCLAVE_COMPLETED">Autoclavi Completato</MenuItem>
            <MenuItem value="IN_NDI">In NDI</MenuItem>
            <MenuItem value="IN_RIFILATURA">In Rifilatura</MenuItem>
            <MenuItem value="COMPLETED">Completato</MenuItem>
            <MenuItem value="ON_HOLD">In Attesa</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ open: false, odl: null })}>
            Annulla
          </Button>
          <Button onClick={handleStatusChange} variant="contained">
            Conferma
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button - Quick QR Scan */}
      <Fab
        color="primary"
        className="fixed bottom-4 right-4"
        href="/dashboard/qr-scanner"
      >
        <QrCodeScanner />
      </Fab>
    </Box>
  );
}