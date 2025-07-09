'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  CenterFocusStrong,
  GridOn,
  Straighten,
  Layers,
  Fullscreen,
  FullscreenExit,
  TouchApp,
} from '@mui/icons-material';
import type { BatchLayout, Placement } from '@/services/optimization-service';

interface BatchLayoutViewerProps {
  batch: BatchLayout;
}

export function BatchLayoutViewer({ batch }: BatchLayoutViewerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(!isMobile);
  const [showDimensions, setShowDimensions] = useState(!isMobile);
  const [showLevels, setShowLevels] = useState<'all' | '0' | '1'>('all');
  const [hoveredPlacement, setHoveredPlacement] = useState<Placement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollOffset, setScrollOffset] = useState({ x: 0, y: 0 });

  // Colori per ODL diversi
  const ODL_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF9FF3', '#54A0FF', '#48DBFB', '#1ABC9C', '#F39C12',
    '#E74C3C', '#9B59B6', '#3498DB', '#2ECC71', '#F1C40F'
  ];

  // Auto-fit al caricamento e resize
  const calculateAutoFit = useCallback(() => {
    if (!containerRef.current) return 1;
    
    const container = containerRef.current;
    const containerWidth = container.clientWidth - (isMobile ? 16 : 32);
    const containerHeight = window.innerHeight * (isFullscreen ? 0.85 : 0.6);
    
    // Calcola dimensioni autoclave dai placement
    const maxX = Math.max(...batch.placements.map(p => p.x + p.width)) + 100;
    const maxY = Math.max(...batch.placements.map(p => p.y + p.height)) + 100;
    
    const scaleX = containerWidth / maxX;
    const scaleY = containerHeight / maxY;
    const fitScale = Math.min(scaleX, scaleY, 2); // max 2x zoom
    
    return Math.max(fitScale, 0.3); // min 0.3x zoom
  }, [batch, isMobile, isFullscreen]);
  
  useEffect(() => {
    const handleResize = () => {
      const newScale = calculateAutoFit();
      setZoom(newScale);
      
      // Aggiorna dimensioni canvas
      if (containerRef.current) {
        const maxX = Math.max(...batch.placements.map(p => p.x + p.width)) + 100;
        const maxY = Math.max(...batch.placements.map(p => p.y + p.height)) + 100;
        setCanvasSize({
          width: Math.min(containerRef.current.clientWidth - 32, maxX * newScale),
          height: Math.min(window.innerHeight * 0.6, maxY * newScale)
        });
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [batch, calculateAutoFit]);
  
  useEffect(() => {
    drawLayout();
  }, [batch, zoom, showGrid, showDimensions, showLevels, canvasSize]);

  const drawLayout = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Trova dimensioni autoclave dai dati (approssimativo)
    const maxX = Math.max(...batch.placements.map(p => p.x + p.width)) + 100;
    const maxY = Math.max(...batch.placements.map(p => p.y + p.height)) + 100;

    // Imposta dimensioni canvas con device pixel ratio per display retina
    const dpr = window.devicePixelRatio || 1;
    const scale = zoom;
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Scala il contesto con DPR
    ctx.scale(scale * dpr, scale * dpr);
    
    // Applica offset scroll
    ctx.translate(-scrollOffset.x, -scrollOffset.y);

    // Sfondo
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, maxX, maxY);

    // Griglia
    if (showGrid) {
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 0.5;
      const gridSize = 100; // 100mm

      for (let x = 0; x <= maxX; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, maxY);
        ctx.stroke();
      }

      for (let y = 0; y <= maxY; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(maxX, y);
        ctx.stroke();
      }
    }

    // Bordo autoclave
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, maxX, maxY);

    // Mappa colori per ODL
    const odlColors: Record<string, string> = {};
    let colorIndex = 0;
    batch.placements.forEach(p => {
      if (!odlColors[p.odl_id]) {
        odlColors[p.odl_id] = ODL_COLORS[colorIndex % ODL_COLORS.length];
        colorIndex++;
      }
    });

    // Disegna placements
    batch.placements.forEach(placement => {
      // Filtra per livello
      if (showLevels !== 'all' && placement.level !== parseInt(showLevels)) {
        return;
      }

      const color = odlColors[placement.odl_id];
      const isHovered = hoveredPlacement?.tool_id === placement.tool_id;

      // Ombra per livello 1
      if (placement.level === 1) {
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
      }

      // Riempimento
      ctx.fillStyle = color;
      ctx.globalAlpha = placement.level === 1 ? 0.8 : 0.9;
      ctx.fillRect(placement.x, placement.y, placement.width, placement.height);

      // Reset ombra
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Bordo
      ctx.strokeStyle = isHovered ? '#000' : placement.level === 1 ? '#666' : '#333';
      ctx.lineWidth = isHovered ? 3 : placement.level === 1 ? 2 : 1;
      if (placement.level === 1) {
        ctx.setLineDash([5, 5]);
      }
      ctx.strokeRect(placement.x, placement.y, placement.width, placement.height);
      ctx.setLineDash([]);

      ctx.globalAlpha = 1;

      // Testo (solo se non troppo piccolo su mobile)
      if (!isMobile || zoom > 0.5) {
        ctx.fillStyle = placement.level === 0 ? '#fff' : '#000';
        const fontSize = Math.max(12, 10 / zoom);
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // ODL number invece di tool_id
        const text = placement.odl_number.substring(0, 8);
        ctx.fillText(
          text,
          placement.x + placement.width / 2,
          placement.y + placement.height / 2
        );
      }

      // Dimensioni
      if (showDimensions) {
        ctx.fillStyle = '#d32f2f';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        // Coordinate
        const coordText = `(${Math.round(placement.x)}, ${Math.round(placement.y)})`;
        ctx.fillText(coordText, placement.x + 5, placement.y + 5);
        
        // Dimensioni
        const dimText = `${Math.round(placement.width)}×${Math.round(placement.height)}`;
        ctx.fillText(dimText, placement.x + 5, placement.y + 20);
      }

      // Indicatore rotazione
      if (placement.rotated) {
        ctx.save();
        ctx.translate(placement.x + placement.width - 20, placement.y + 20);
        ctx.rotate((45 * Math.PI) / 180);
        ctx.fillStyle = '#1976d2';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('↻', 0, 0);
        ctx.restore();
      }
    });

    // Legenda livelli
    if (showLevels === 'all') {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillRect(10, 10, 150, 60);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, 150, 60);

      ctx.fillStyle = '#333';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('Legenda:', 20, 20);

      // Livello 0
      ctx.fillStyle = ODL_COLORS[0];
      ctx.fillRect(20, 35, 20, 10);
      ctx.fillStyle = '#333';
      ctx.font = '11px Arial';
      ctx.fillText('Livello base', 45, 36);

      // Livello 1
      ctx.fillStyle = ODL_COLORS[1];
      ctx.globalAlpha = 0.8;
      ctx.fillRect(20, 50, 20, 10);
      ctx.globalAlpha = 1;
      ctx.setLineDash([2, 2]);
      ctx.strokeRect(20, 50, 20, 10);
      ctx.setLineDash([]);
      ctx.fillStyle = '#333';
      ctx.fillText('Supporti rialzati', 45, 51);
    }
  };

  const handleZoomIn = () => setZoom(Math.min(zoom * 1.2, 3));
  const handleZoomOut = () => setZoom(Math.max(zoom / 1.2, 0.3));
  const handleZoomReset = () => {
    const fitScale = calculateAutoFit();
    setZoom(fitScale);
    setScrollOffset({ x: 0, y: 0 });
  };
  
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  // Gestione touch/mouse per pan
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX + scrollOffset.x, y: e.clientY + scrollOffset.y });
  };
  
  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      const newOffset = {
        x: dragStart.x - e.clientX,
        y: dragStart.y - e.clientY
      };
      setScrollOffset(newOffset);
    }
  };
  
  const handlePointerUp = () => {
    setIsDragging(false);
  };
  
  // Gestione wheel per zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prevZoom => Math.max(0.3, Math.min(3, prevZoom * delta)));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    const placement = batch.placements.find(p =>
      x >= p.x && x <= p.x + p.width &&
      y >= p.y && y <= p.y + p.height
    );

    setHoveredPlacement(placement || null);
  };

  return (
    <Box>
      {/* Controlli */}
      <Paper 
        variant="outlined" 
        sx={{ 
          p: isMobile ? 1 : 2, 
          mb: 2,
          position: isFullscreen ? 'fixed' : 'relative',
          top: isFullscreen ? 10 : 'auto',
          left: isFullscreen ? 10 : 'auto',
          right: isFullscreen ? 10 : 'auto',
          zIndex: isFullscreen ? 1000 : 'auto',
          bgcolor: 'background.paper',
          boxShadow: isFullscreen ? 3 : 0
        }}
      >
        <Stack 
          direction={isMobile ? "column" : "row"} 
          spacing={isMobile ? 1 : 2} 
          alignItems={isMobile ? "stretch" : "center"}
        >
          {/* Zoom */}
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton size="small" onClick={handleZoomOut}>
              <ZoomOut />
            </IconButton>
            {!isMobile && (
              <Box sx={{ width: 120, mx: 1 }}>
                <Slider
                  value={zoom}
                  onChange={(_, value) => setZoom(value as number)}
                  min={0.3}
                  max={3}
                  step={0.1}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                />
              </Box>
            )}
            <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'center' }}>
              {Math.round(zoom * 100)}%
            </Typography>
            <IconButton size="small" onClick={handleZoomIn}>
              <ZoomIn />
            </IconButton>
            <Tooltip title="Reset zoom">
              <IconButton size="small" onClick={handleZoomReset}>
                <CenterFocusStrong />
              </IconButton>
            </Tooltip>
          </Stack>

          <Divider orientation="vertical" flexItem />

          {/* Opzioni visualizzazione */}
          <ToggleButtonGroup size="small">
            <ToggleButton
              value="grid"
              selected={showGrid}
              onClick={() => setShowGrid(!showGrid)}
            >
              <GridOn fontSize="small" />
            </ToggleButton>
            <ToggleButton
              value="dimensions"
              selected={showDimensions}
              onClick={() => setShowDimensions(!showDimensions)}
            >
              <Straighten fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>

          <Divider orientation="vertical" flexItem />

          {/* Filtro livelli */}
          <ToggleButtonGroup
            value={showLevels}
            exclusive
            onChange={(_, value) => value && setShowLevels(value)}
            size="small"
          >
            <ToggleButton value="all">
              <Layers fontSize="small" sx={{ mr: 0.5 }} />
              Tutti
            </ToggleButton>
            <ToggleButton value="0">Base</ToggleButton>
            <ToggleButton value="1">Rialzati</ToggleButton>
          </ToggleButtonGroup>
          
          {!isMobile && (
            <>
              <Divider orientation="vertical" flexItem />
              <Tooltip title={isFullscreen ? "Esci da schermo intero" : "Schermo intero"}>
                <IconButton size="small" onClick={handleFullscreen}>
                  {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                </IconButton>
              </Tooltip>
            </>
          )}
        </Stack>
        
        {isMobile && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            <TouchApp fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            Pizzica per zoom • Trascina per navigare
          </Typography>
        )}
      </Paper>

      {/* Canvas container */}
      <Paper 
        ref={containerRef}
        variant="outlined" 
        sx={{ 
          p: isMobile ? 1 : 2, 
          overflow: 'hidden',
          maxHeight: isFullscreen ? '90vh' : '60vh',
          backgroundColor: '#fafafa',
          position: 'relative',
          touchAction: 'none',
          userSelect: 'none'
        }}
        onWheel={handleWheel}
      >
        <Box
          sx={{
            overflow: 'auto',
            maxHeight: '100%',
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        >
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredPlacement(null)}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{ 
              display: 'block',
              touchAction: 'none',
              imageRendering: zoom > 1.5 ? 'pixelated' : 'auto'
            }}
          />
        </Box>
      </Paper>

      {/* Info placement hovering */}
      {hoveredPlacement && (
        <Paper variant="outlined" sx={{ p: 1, mt: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip
              label={`ODL: ${hoveredPlacement.odl_number}`}
              size="small"
              color="primary"
            />
            <Chip
              label={`Tool: ${hoveredPlacement.tool_id}`}
              size="small"
            />
            <Typography variant="caption" color="text.secondary">
              Posizione: ({Math.round(hoveredPlacement.x)}, {Math.round(hoveredPlacement.y)})
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Dimensioni: {Math.round(hoveredPlacement.width)} × {Math.round(hoveredPlacement.height)} mm
            </Typography>
            {hoveredPlacement.rotated && (
              <Chip label="Ruotato 90°" size="small" color="secondary" />
            )}
            {hoveredPlacement.level === 1 && (
              <Chip label="Supporto rialzato" size="small" color="warning" />
            )}
          </Stack>
        </Paper>
      )}

      {/* Se layout da base64 */}
      {batch.layout_image_base64 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Layout generato dal servizio di ottimizzazione:
          </Typography>
          <img
            src={`data:image/png;base64,${batch.layout_image_base64}`}
            alt="Layout ottimizzato"
            style={{ 
              maxWidth: '100%', 
              height: 'auto',
              border: '1px solid #ddd',
              borderRadius: 4
            }}
          />
        </Box>
      )}
    </Box>
  );
}