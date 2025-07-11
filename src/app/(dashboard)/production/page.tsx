'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Button,
  InputAdornment,
  Tooltip,
  Skeleton
} from '@mui/material';
import {
  Search,
  FilterList,
  Refresh,
  Factory,
  Assignment,
  TrendingUp,
  Schedule,
  Visibility,
  QrCodeScanner
} from '@mui/icons-material';
import { ODLStatus, Priority } from '@prisma/client';
import { StatusChip } from '@/components/atoms';

interface ProductionODL {
  id: string;
  odlNumber: string;
  partNumber: string;
  description: string;
  status: ODLStatus;
  priority: Priority;
  quantity: number;
  expectedCompletionDate?: string;
  currentDepartment?: string;
  assignedOperator?: string;
  timeInDepartment?: number;
  isPaused?: boolean;
  lastUpdate: string;
  nextDepartment?: string;
}

interface ProductionStats {
  totalODL: number;
  inProgress: number;
  completed: number;
  averageCycleTime: number;
}

export default function ProductionPage() {
  const [odlList, setOdlList] = useState<ProductionODL[]>([]);
  const [filteredODL, setFilteredODL] = useState<ProductionODL[]>([]);
  const [stats, setStats] = useState<ProductionStats>({ 
    totalODL: 0, 
    inProgress: 0, 
    completed: 0, 
    averageCycleTime: 0 
  });
  const [loading, setLoading] = useState(true);
  
  // Filtri
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  useEffect(() => {
    loadProductionData();
  }, []);

  useEffect(() => {
    // Applica filtri ogni volta che cambiano
    applyFilters();
  }, [searchTerm, statusFilter, departmentFilter, priorityFilter, odlList]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProductionData = async () => {
    setLoading(true);
    try {
      const [odlResponse, statsResponse] = await Promise.all([
        fetch('/api/production/odl/overview'),
        fetch('/api/production/stats')
      ]);

      if (odlResponse.ok) {
        const odlData = await odlResponse.json();
        setOdlList(odlData);
      } else {
        console.error('Errore nel caricamento ODL produzione:', odlResponse.statusText)
        setOdlList([]);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      } else {
        console.error('Errore nel caricamento statistiche produzione:', statsResponse.statusText)
        setStats({
          totalODL: 0,
          inProgress: 0,
          completed: 0,
          averageCycleTime: 0
        });
      }

    } catch (error) {
      console.error('Error loading production data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...odlList];

    // Filtro ricerca
    if (searchTerm) {
      filtered = filtered.filter(odl =>
        odl.odlNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        odl.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        odl.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro stato
    if (statusFilter) {
      filtered = filtered.filter(odl => odl.status === statusFilter);
    }

    // Filtro reparto
    if (departmentFilter) {
      filtered = filtered.filter(odl => odl.currentDepartment === departmentFilter);
    }

    // Filtro priorità
    if (priorityFilter) {
      filtered = filtered.filter(odl => odl.priority === priorityFilter);
    }

    setFilteredODL(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setDepartmentFilter('');
    setPriorityFilter('');
  };

  const getStatusColor = (status: ODLStatus) => {
    switch (status) {
      // Stati "IN_" - in lavorazione (blu)
      case 'IN_HONEYCOMB':
      case 'IN_CLEANROOM':
      case 'IN_AUTOCLAVE':
      case 'IN_CONTROLLO_NUMERICO':
      case 'IN_NDI':
      case 'IN_MONTAGGIO':
      case 'IN_VERNICIATURA':
      case 'IN_MOTORI':
      case 'IN_CONTROLLO_QUALITA':
        return 'info';
      // Stati "COMPLETED" - completato per reparto (verde)  
      case 'HONEYCOMB_COMPLETED':
      case 'CLEANROOM_COMPLETED':
      case 'AUTOCLAVE_COMPLETED':
      case 'CONTROLLO_NUMERICO_COMPLETED':
      case 'NDI_COMPLETED':
      case 'MONTAGGIO_COMPLETED':
      case 'VERNICIATURA_COMPLETED':
      case 'MOTORI_COMPLETED':
      case 'CONTROLLO_QUALITA_COMPLETED':
      case 'COMPLETED':
        return 'success';
      // Stati speciali
      case 'ON_HOLD':
        return 'warning';
      case 'CANCELLED':
        return 'error';
      case 'CREATED':
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'warning';
      case 'NORMAL': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Removed - using StatusChip component instead

  if (loading) {
    return (
      <Box className="p-4 space-y-4">
        <Skeleton variant="rectangular" height={60} />
        <Box className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton variant="rectangular" height={120} key={i} />
          ))}
        </Box>
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  return (
    <Box className="p-4 space-y-6">
        {/* Header Actions */}
        <Box className="flex items-center justify-end gap-2">
          <Button
            variant="outlined"
            startIcon={<QrCodeScanner />}
            href="/qr-scanner"
          >
            Scanner QR
          </Button>
          <IconButton onClick={loadProductionData}>
            <Refresh />
          </IconButton>
        </Box>

      {/* Stats Cards */}
      <Box className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <Card>
            <CardContent>
              <Box className="flex items-center justify-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    ODL Totali
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalODL}
                  </Typography>
                </Box>
                <Assignment color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box className="flex items-center justify-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    In Lavorazione
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {stats.inProgress}
                  </Typography>
                </Box>
                <TrendingUp color="primary" sx={{ fontSize: 40 }} />
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
                    {stats.completed}
                  </Typography>
                </Box>
                <Assignment color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box className="flex items-center justify-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Tempo Medio Trasf.
                  </Typography>
                  <Typography variant="h4">
                    {stats.averageCycleTime > 0 ? formatTime(stats.averageCycleTime) : '--'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Minuti per trasferimento
                  </Typography>
                </Box>
                <Schedule color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
      </Box>

      {/* Filters */}
      <Card>
        <CardContent>
          <Box className="flex items-center gap-2 mb-4">
            <FilterList />
            <Typography variant="h6">Filtri Avanzati</Typography>
            <Box className="flex items-center gap-2">
              <Chip 
                label={`${filteredODL.length} risultati`} 
                color="primary" 
                size="small" 
              />
              <Button size="small" onClick={clearFilters}>
                Cancella tutti
              </Button>
            </Box>
          </Box>
          
          <Box className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <TextField
                fullWidth
                placeholder="Cerca ODL, parte, descrizione..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
    <TextField
                select
                fullWidth
                label="Stato"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">Tutti gli stati</MenuItem>
                <MenuItem value="IN_CLEANROOM">In Clean Room</MenuItem>
                <MenuItem value="CLEANROOM_COMPLETED">Clean Room OK</MenuItem>
                <MenuItem value="IN_AUTOCLAVE">In Autoclavi</MenuItem>
                <MenuItem value="AUTOCLAVE_COMPLETED">Autoclavi OK</MenuItem>
                <MenuItem value="IN_NDI">In NDI</MenuItem>
                <MenuItem value="COMPLETED">Completato</MenuItem>
                <MenuItem value="ON_HOLD">In Attesa</MenuItem>
              </TextField>
    <TextField
                select
                fullWidth
                label="Reparto"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <MenuItem value="">Tutti i reparti</MenuItem>
                <MenuItem value="Clean Room">Clean Room</MenuItem>
                <MenuItem value="Autoclavi">Autoclavi</MenuItem>
                <MenuItem value="NDI">NDI</MenuItem>
              </TextField>
    <TextField
                select
                fullWidth
                label="Priorità"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <MenuItem value="">Tutte le priorità</MenuItem>
                <MenuItem value="HIGH">Alta</MenuItem>
                <MenuItem value="NORMAL">Normale</MenuItem>
                <MenuItem value="LOW">Bassa</MenuItem>
              </TextField>
          </Box>
        </CardContent>
      </Card>

      {/* ODL Table */}
      <Card>
        <CardContent>
          <Box className="flex items-center justify-between mb-4">
            <Typography variant="h6">
              ODL in Produzione ({filteredODL.length})
            </Typography>
          </Box>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ODL</TableCell>
                  <TableCell>Parte</TableCell>
                  <TableCell>Stato</TableCell>
                  <TableCell>Priorità</TableCell>
                  <TableCell>ECD</TableCell>
                  <TableCell>Reparto Attuale</TableCell>
                  <TableCell>Operatore</TableCell>
                  <TableCell>Tempo</TableCell>
                  <TableCell>Prossimo Reparto</TableCell>
                  <TableCell>Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredODL.map((odl) => (
                  <TableRow key={odl.id} hover>
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
                      <StatusChip 
                        status={odl.status}
                        type="odl"
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
                      <Typography variant="body2">
                        {odl.expectedCompletionDate 
                          ? new Date(odl.expectedCompletionDate).toLocaleDateString('it-IT')
                          : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {odl.currentDepartment || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {odl.assignedOperator || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {odl.timeInDepartment && odl.timeInDepartment > 0 ? (
                        <Typography 
                          variant="body2" 
                          color={odl.isPaused ? "warning.main" : "primary"}
                        >
                          {formatTime(odl.timeInDepartment)}
                          {odl.isPaused && ' (Pausa)'}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          Non attivo
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {odl.nextDepartment ? (
                        <Chip
                          label={odl.nextDepartment}
                          variant="outlined"
                          size="small"
                        />
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Visualizza dettagli">
                        <IconButton size="small" href={`/production/odl/${odl.id}`}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
      {filteredODL.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <Typography color="textSecondary">
                        Nessun ODL trovato con i filtri applicati
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}