'use client';

import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  Divider,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  useMediaQuery,
  Button,
  ButtonGroup,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  Badge,
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  CenterFocusStrong,
  GridOn,
  Straighten,
  Fullscreen,
  FullscreenExit,
  TouchApp,
  GetApp,
  Print,
  ViewInAr,
  Layers,
  Info,
  ExpandMore,
  ExpandLess,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import type { BatchLayout, Placement } from '@/services/optimization-service';

interface EnhancedBatchLayoutViewerProps {
  batch: BatchLayout;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`batch-tabpanel-${index}`}
      aria-labelledby={`batch-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

interface CanvasViewerProps {
  batch: BatchLayout;
  viewMode: 'floor' | 'elevated';
  showGrid?: boolean;
  showDimensions?: boolean;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
}

interface CanvasCache {
  backgroundLayer: ImageData | null;
  placementsLayer: ImageData | null;
  gridLayer: ImageData | null;
  lastViewMode: string;
  lastZoom: number;
  lastDimensions: { width: number; height: number };
  dirty: boolean;
}

const CanvasViewer: React.FC<CanvasViewerProps> = memo(({ 
  batch, 
  viewMode,
  showGrid = true,
  showDimensions = true,
  zoom = 1,
  onZoomChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredPlacement, setHoveredPlacement] = useState<Placement | null>(null);
  const [dragState, setDragState] = useState({ isDragging: false, startX: 0, startY: 0 });
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const theme = useTheme();
  
  // Cache per layer pre-renderizzati
  const cacheRef = useRef<CanvasCache>({
    backgroundLayer: null,
    placementsLayer: null,
    gridLayer: null,
    lastViewMode: '',
    lastZoom: 0,
    lastDimensions: { width: 0, height: 0 },
    dirty: true
  });

  // Colori per ODL
  const getODLColor = useCallback((odlId: string, index: number) => {
    const colors = theme.palette.mode === 'dark' ? [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#FF9FF3', '#54A0FF', '#48DBFB', '#1ABC9C', '#F39C12'
    ] : [
      '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6',
      '#1ABC9C', '#E67E22', '#34495E', '#16A085', '#27AE60'
    ];
    return colors[index % colors.length];
  }, [theme]);

  // Calcola dimensioni autoclave reali
  const autoclaveDimensions = useMemo(() => {
    // PRIORITÀ 1: Usa dimensioni reali dell'autoclave se disponibili e valide
    if (batch.autoclave_dimensions && 
        batch.autoclave_dimensions.width > 0 && 
        batch.autoclave_dimensions.height > 0) {
      return {
        width: batch.autoclave_dimensions.width,
        height: batch.autoclave_dimensions.height
      };
    }
    
    // PRIORITÀ 2: Calcola da configurazione autoclave (se disponibile nel batch)
    if (batch.autoclave_code) {
      // Dimensioni standard per autoclavi comuni (database configurabile)
      const standardDimensions: Record<string, { width: number; height: number }> = {
        'AC01': { width: 3500, height: 2400 },
        'AC02': { width: 4000, height: 2800 },
        'AC03': { width: 3000, height: 2000 },
        'AC04': { width: 4500, height: 3200 },
        'AC05': { width: 3200, height: 2200 }
      };
      
      const standardDim = standardDimensions[batch.autoclave_code];
      if (standardDim) {
        return standardDim;
      }
    }
    
    // FALLBACK: Calcola da placements con margini appropriati
    if (batch.placements.length === 0) {
      return { width: 3500, height: 2400 }; // Dimensioni standard realistiche
    }
    
    const maxX = Math.max(...batch.placements.map(p => p.x + p.width));
    const maxY = Math.max(...batch.placements.map(p => p.y + p.height));
    
    // Margini minimi per operazioni sicure (300mm bordo)
    return {
      width: Math.max(maxX + 300, 3000), // Minimo realistico 3000mm
      height: Math.max(maxY + 300, 2000)  // Minimo realistico 2000mm
    };
  }, [batch.autoclave_dimensions, batch.autoclave_code, batch.placements]);

  // Filtra placements per viewMode con validazione robusta
  const visiblePlacements = useMemo(() => {
    // Validazione difensiva - verifica che batch e placements esistano
    if (!batch || !batch.placements || !Array.isArray(batch.placements)) {
      console.warn('Batch o placements non validi:', batch);
      return [];
    }

    // Filtra placements validi (con coordinate e dimensioni positive)
    const validPlacements = batch.placements.filter(p => {
      if (!p || typeof p.x !== 'number' || typeof p.y !== 'number' || 
          typeof p.width !== 'number' || typeof p.height !== 'number') {
        console.warn('Placement con dati invalidi:', p);
        return false;
      }
      
      if (p.width <= 0 || p.height <= 0) {
        console.warn('Placement con dimensioni non valide:', p);
        return false;
      }
      
      return true;
    });

    // Filtra per modalità visualizzazione
    if (viewMode === 'floor') {
      return validPlacements.filter(p => (p.level ?? 0) === 0);
    } else {
      return validPlacements.filter(p => (p.level ?? 0) === 1);
    }
  }, [batch, viewMode]);

  // Raggruppa per ODL con validazione robusta
  const odlGroups = useMemo(() => {
    const groups = new Map<string, { 
      odl: string, 
      partNumber: string, 
      placements: Placement[], 
      color: string 
    }>();
    
    // Validazione difensiva per visiblePlacements
    if (!Array.isArray(visiblePlacements)) {
      console.warn('visiblePlacements non è un array valido');
      return [];
    }
    
    visiblePlacements.forEach((placement, index) => {
      // Validazione placement
      if (!placement || !placement.odl_id) {
        console.warn('Placement senza ODL ID valido:', placement);
        return;
      }
      
      if (!groups.has(placement.odl_id)) {
        groups.set(placement.odl_id, {
          odl: placement.odl_number || `ODL_${placement.odl_id.substring(0, 8)}`,
          partNumber: placement.part_number || 'N/A',
          placements: [],
          color: getODLColor(placement.odl_id, groups.size)
        });
      }
      
      const group = groups.get(placement.odl_id);
      if (group) {
        group.placements.push(placement);
      }
    });
    
    return Array.from(groups.values());
  }, [visiblePlacements, getODLColor]);

  // Renderizza canvas con ottimizzazioni performance
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = autoclaveDimensions.width;
    const height = autoclaveDimensions.height;

    // Imposta dimensioni canvas
    canvas.width = width * zoom * dpr;
    canvas.height = height * zoom * dpr;
    canvas.style.width = `${width * zoom}px`;
    canvas.style.height = `${height * zoom}px`;

    // Pulisci e configura
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(zoom * dpr, zoom * dpr);
    ctx.translate(-viewOffset.x, -viewOffset.y);

    // Renderizza solo se visibile nell'area di visualizzazione
    const viewportBounds = {
      left: viewOffset.x,
      top: viewOffset.y,
      right: viewOffset.x + (canvas.offsetWidth / zoom),
      bottom: viewOffset.y + (canvas.offsetHeight / zoom)
    };

    // Sfondo
    ctx.fillStyle = theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5';
    ctx.fillRect(0, 0, width, height);

    // Griglia
    if (showGrid) {
      ctx.strokeStyle = theme.palette.mode === 'dark' ? '#333' : '#e0e0e0';
      ctx.lineWidth = 0.5;
      const gridSize = 100;

      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Etichette griglia
      ctx.fillStyle = theme.palette.mode === 'dark' ? '#666' : '#999';
      ctx.font = '10px Arial';
      for (let x = 0; x <= width; x += gridSize) {
        ctx.fillText(`${x}`, x + 2, 12);
      }
      for (let y = gridSize; y <= height; y += gridSize) {
        ctx.fillText(`${y}`, 2, y - 2);
      }
    }

    // Bordo autoclave
    ctx.strokeStyle = theme.palette.primary.main;
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, width, height);

    // Disegna placements ottimizzati con culling
    odlGroups.forEach(group => {
      ctx.fillStyle = group.color;
      ctx.strokeStyle = '#000';

      group.placements.forEach(placement => {
        // Culling: salta se fuori dal viewport
        if (placement.x + placement.width < viewportBounds.left ||
            placement.x > viewportBounds.right ||
            placement.y + placement.height < viewportBounds.top ||
            placement.y > viewportBounds.bottom) {
          return;
        }

        const isHovered = hoveredPlacement?.tool_id === placement.tool_id;

        // Effetto 3D per livelli elevati
        if (viewMode === 'elevated') {
          ctx.shadowColor = 'rgba(0,0,0,0.4)';
          ctx.shadowBlur = 15;
          ctx.shadowOffsetX = 8;
          ctx.shadowOffsetY = 8;
        }

        // Riempimento
        ctx.globalAlpha = isHovered ? 1 : 0.85;
        ctx.fillRect(placement.x, placement.y, placement.width, placement.height);

        // Reset ombra
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Bordo
        ctx.lineWidth = isHovered ? 3 : 2;
        ctx.strokeRect(placement.x, placement.y, placement.width, placement.height);
        ctx.globalAlpha = 1;

        // Ottimizzazione testo: mostra solo se zoom sufficiente
        if (zoom >= 0.5) {
          ctx.fillStyle = '#fff';
          ctx.font = `bold ${Math.max(12, 14 / zoom)}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Mostra part number completo
          const text = placement.part_number || placement.odl_number.substring(0, 8);
          ctx.fillText(
            text,
            placement.x + placement.width / 2,
            placement.y + placement.height / 2 - 10
          );

          // Tool ID solo se zoom alto
          if (zoom >= 0.8) {
            ctx.font = `${Math.max(10, 12 / zoom)}px Arial`;
            ctx.fillText(
              placement.tool_name || `Tool ${placement.tool_id}`,
              placement.x + placement.width / 2,
              placement.y + placement.height / 2 + 10
            );
          }

          // Dimensioni solo se richieste e zoom alto
          if (showDimensions && zoom >= 1) {
            ctx.fillStyle = theme.palette.error.main;
            ctx.font = '11px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            
            const coordText = `(${Math.round(placement.x)}, ${Math.round(placement.y)})`;
            ctx.fillText(coordText, placement.x + 5, placement.y + 5);
            
            const dimText = `${Math.round(placement.width)}×${Math.round(placement.height)}mm`;
            ctx.fillText(dimText, placement.x + 5, placement.y + 20);
          }

          // Indicatore rotazione
          if (placement.rotated && zoom >= 0.7) {
            ctx.save();
            ctx.translate(placement.x + placement.width - 25, placement.y + 25);
            ctx.rotate((45 * Math.PI) / 180);
            ctx.fillStyle = theme.palette.warning.main;
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('↻', 0, 0);
            ctx.restore();
          }
        }
      });
    });

    // Info autoclave
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillRect(10, height - 80, 300, 70);
    ctx.strokeStyle = theme.palette.primary.main;
    ctx.lineWidth = 2;
    ctx.strokeRect(10, height - 80, 300, 70);

    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Autoclave: ${batch.autoclave_code}`, 20, height - 70);
    ctx.font = '12px Arial';
    ctx.fillText(`Dimensioni: ${width} × ${height} mm`, 20, height - 50);
    ctx.fillText(`Ciclo: ${batch.curing_cycle}`, 20, height - 30);
    if (batch.curing_time_minutes) {
      ctx.fillText(`Tempo cura: ${batch.curing_time_minutes} min`, 160, height - 30);
    }
  }, [
    autoclaveDimensions, 
    batch, 
    hoveredPlacement, 
    odlGroups, 
    showDimensions, 
    showGrid, 
    theme, 
    viewMode, 
    viewOffset, 
    zoom
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Gestione mouse
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom + viewOffset.x;
    const y = (e.clientY - rect.top) / zoom + viewOffset.y;

    const placement = visiblePlacements.find(p =>
      x >= p.x && x <= p.x + p.width &&
      y >= p.y && y <= p.y + p.height
    );

    setHoveredPlacement(placement || null);
  }, [visiblePlacements, viewOffset, zoom]);

  // Gestione drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setDragState({
      isDragging: true,
      startX: e.clientX + viewOffset.x * zoom,
      startY: e.clientY + viewOffset.y * zoom
    });
  }, [viewOffset, zoom]);

  const handleMouseUp = useCallback(() => {
    setDragState(prev => ({ ...prev, isDragging: false }));
  }, []);

  const handleMouseMoveGlobal = useCallback((e: MouseEvent) => {
    if (dragState.isDragging) {
      setViewOffset({
        x: (dragState.startX - e.clientX) / zoom,
        y: (dragState.startY - e.clientY) / zoom
      });
    }
  }, [dragState, zoom]);

  useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener('mousemove', handleMouseMoveGlobal);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMoveGlobal);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMoveGlobal, handleMouseUp]);

  return (
    <Box>
      <Paper
        sx={{
          p: 2,
          overflow: 'auto',
          maxHeight: '70vh',
          backgroundColor: theme.palette.mode === 'dark' ? '#0a0a0a' : '#fafafa',
          cursor: dragState.isDragging ? 'grabbing' : 'grab'
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseLeave={() => setHoveredPlacement(null)}
          style={{
            display: 'block',
            margin: '0 auto',
            border: `1px solid ${theme.palette.divider}`
          }}
        />
      </Paper>

      {hoveredPlacement && (
        <Paper sx={{ p: 2, mt: 1 }} elevation={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="primary">
                Part Number: {hoveredPlacement.part_number}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ODL: {hoveredPlacement.odl_number}
              </Typography>
              {hoveredPlacement.part_description && (
                <Typography variant="body2" color="text.secondary">
                  {hoveredPlacement.part_description}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  label={hoveredPlacement.tool_name || `Tool ${hoveredPlacement.tool_id}`}
                  size="small"
                  color="secondary"
                />
                <Chip
                  label={`${Math.round(hoveredPlacement.width)} × ${Math.round(hoveredPlacement.height)} mm`}
                  size="small"
                />
                {hoveredPlacement.rotated && (
                  <Chip label="Ruotato 90°" size="small" color="warning" />
                )}
                <Chip
                  label={`Pos: (${Math.round(hoveredPlacement.x)}, ${Math.round(hoveredPlacement.y)})`}
                  size="small"
                  variant="outlined"
                />
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  )
}

export function EnhancedBatchLayoutViewer({ batch }: EnhancedBatchLayoutViewerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tabValue, setTabValue] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [showDimensions, setShowDimensions] = useState(!isMobile);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandedInfo, setExpandedInfo] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Statistiche batch
  const batchStats = useMemo(() => {
    const odlCount = new Set(batch.placements.map(p => p.odl_id)).size;
    const partNumbers = new Set(batch.placements.map(p => p.part_number));
    const floorPlacements = batch.placements.filter(p => p.level === 0);
    const elevatedPlacements = batch.placements.filter(p => p.level === 1);

    return {
      odlCount,
      partNumbers: Array.from(partNumbers),
      toolCount: batch.placements.length,
      floorCount: floorPlacements.length,
      elevatedCount: elevatedPlacements.length,
      hasElevated: elevatedPlacements.length > 0
    };
  }, [batch]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));
  const handleZoomReset = () => setZoom(1);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleExport = (format: 'pdf' | 'dxf') => {
    // TODO: Implementare export
    console.log(`Export ${format} for batch ${batch.batch_id}`);
  };

  return (
    <Box ref={containerRef}>
      {/* Header info */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" gutterBottom>
              Batch {batch.batch_id.substring(0, 8)}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip
                label={`Autoclave ${batch.autoclave_code}`}
                color="primary"
                icon={<ViewInAr />}
              />
              <Chip
                label={`Ciclo ${batch.curing_cycle}`}
                color="secondary"
              />
              {batch.curing_time_minutes && (
                <Chip
                  label={`${batch.curing_time_minutes} min`}
                  variant="outlined"
                />
              )}
              <Chip
                label={`${batchStats.odlCount} ODL`}
                variant="outlined"
              />
              <Chip
                label={`${batchStats.toolCount} Tool`}
                variant="outlined"
              />
            </Stack>
          </Box>
          <IconButton onClick={() => setExpandedInfo(!expandedInfo)}>
            {expandedInfo ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Stack>

        <Collapse in={expandedInfo}>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Metriche Batch
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Efficienza Area</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${Math.round(batch.metrics.area_efficiency * 100)}%`}
                          size="small"
                          color={batch.metrics.area_efficiency > 0.8 ? 'success' : 'warning'}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Peso Totale</TableCell>
                      <TableCell align="right">{batch.metrics.total_weight.toFixed(1)} kg</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Linee Vacuum</TableCell>
                      <TableCell align="right">{batch.metrics.vacuum_lines_used}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Area Sprecata</TableCell>
                      <TableCell align="right">{batch.metrics.wasted_area.toFixed(0)} mm²</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Part Numbers nel Batch
              </Typography>
              <List dense>
                {batchStats.partNumbers.map((pn, index) => (
                  <ListItem key={pn}>
                    <ListItemIcon>
                      <CheckCircle color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={pn} />
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        </Collapse>
      </Paper>

      {/* Controlli */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton size="small" onClick={handleZoomOut}>
                <ZoomOut />
              </IconButton>
              <Slider
                value={zoom}
                onChange={(_, value) => setZoom(value as number)}
                min={0.3}
                max={3}
                step={0.1}
                sx={{ width: 150 }}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
              />
              <IconButton size="small" onClick={handleZoomIn}>
                <ZoomIn />
              </IconButton>
              <IconButton size="small" onClick={handleZoomReset}>
                <CenterFocusStrong />
              </IconButton>
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <ToggleButtonGroup size="small" sx={{ width: '100%' }}>
              <ToggleButton
                value="grid"
                selected={showGrid}
                onClick={() => setShowGrid(!showGrid)}
              >
                <GridOn fontSize="small" />
                {!isMobile && ' Griglia'}
              </ToggleButton>
              <ToggleButton
                value="dimensions"
                selected={showDimensions}
                onClick={() => setShowDimensions(!showDimensions)}
              >
                <Straighten fontSize="small" />
                {!isMobile && ' Misure'}
              </ToggleButton>
              {!isMobile && (
                <ToggleButton
                  value="fullscreen"
                  selected={isFullscreen}
                  onClick={handleFullscreen}
                >
                  {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                </ToggleButton>
              )}
            </ToggleButtonGroup>
          </Grid>

          <Grid item xs={12} md={4}>
            <ButtonGroup size="small" variant="outlined" fullWidth>
              <Button
                startIcon={<GetApp />}
                onClick={() => handleExport('pdf')}
              >
                PDF
              </Button>
              <Button
                startIcon={<GetApp />}
                onClick={() => handleExport('dxf')}
              >
                DXF
              </Button>
              <Button startIcon={<Print />}>
                Stampa
              </Button>
            </ButtonGroup>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs per visualizzazioni */}
      <Paper>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            label="Vista Piano Base"
            icon={<Layers />}
            iconPosition="start"
          />
          {batchStats.hasElevated && (
            <Tab
              label="Vista Supporti Rialzati"
              icon={<ViewInAr />}
              iconPosition="start"
            />
          )}
          <Tab
            label="Lista Posizionamento"
            icon={<Info />}
            iconPosition="start"
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <CanvasViewer
            batch={batch}
            viewMode="floor"
            showGrid={showGrid}
            showDimensions={showDimensions}
            zoom={zoom}
            onZoomChange={setZoom}
          />
        </TabPanel>

        {batchStats.hasElevated && (
          <TabPanel value={tabValue} index={1}>
            <CanvasViewer
              batch={batch}
              viewMode="elevated"
              showGrid={showGrid}
              showDimensions={showDimensions}
              zoom={zoom}
              onZoomChange={setZoom}
            />
          </TabPanel>
        )}

        <TabPanel value={tabValue} index={batchStats.hasElevated ? 2 : 1}>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Part Number</TableCell>
                  <TableCell>ODL</TableCell>
                  <TableCell>Tool</TableCell>
                  <TableCell>Posizione</TableCell>
                  <TableCell>Dimensioni</TableCell>
                  <TableCell>Livello</TableCell>
                  <TableCell>Note</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {batch.placements.map((placement, index) => (
                  <TableRow key={`${placement.odl_id}-${placement.tool_id}`}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {placement.part_number}
                      </Typography>
                      {placement.part_description && (
                        <Typography variant="caption" color="text.secondary">
                          {placement.part_description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{placement.odl_number}</TableCell>
                    <TableCell>{placement.tool_name || `Tool ${placement.tool_id}`}</TableCell>
                    <TableCell>({Math.round(placement.x)}, {Math.round(placement.y)})</TableCell>
                    <TableCell>{Math.round(placement.width)} × {Math.round(placement.height)}</TableCell>
                    <TableCell>
                      <Chip
                        label={placement.level === 0 ? 'Base' : 'Rialzato'}
                        size="small"
                        color={placement.level === 0 ? 'default' : 'warning'}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        {placement.rotated && (
                          <Chip label="90°" size="small" variant="outlined" />
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {isMobile && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          <TouchApp fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
          Pizzica per zoom • Trascina per navigare
        </Typography>
      )}
    </Box>
  );
}