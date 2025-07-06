'use client';

import { useEffect, useRef, useState } from 'react';
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
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  CenterFocusStrong,
  GridOn,
  Straighten,
  Layers,
} from '@mui/icons-material';
import type { BatchLayout, Placement } from '@/services/optimization-service';

interface BatchLayoutViewerProps {
  batch: BatchLayout;
}

export function BatchLayoutViewer({ batch }: BatchLayoutViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [showLevels, setShowLevels] = useState<'all' | '0' | '1'>('all');
  const [hoveredPlacement, setHoveredPlacement] = useState<Placement | null>(null);

  // Colori per ODL diversi
  const ODL_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF9FF3', '#54A0FF', '#48DBFB', '#1ABC9C', '#F39C12',
    '#E74C3C', '#9B59B6', '#3498DB', '#2ECC71', '#F1C40F'
  ];

  useEffect(() => {
    drawLayout();
  }, [batch, zoom, showGrid, showDimensions, showLevels]);

  const drawLayout = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Trova dimensioni autoclave dai dati (approssimativo)
    const maxX = Math.max(...batch.placements.map(p => p.x + p.width)) + 100;
    const maxY = Math.max(...batch.placements.map(p => p.y + p.height)) + 100;

    // Imposta dimensioni canvas
    const scale = zoom;
    canvas.width = maxX * scale;
    canvas.height = maxY * scale;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Scala il contesto
    ctx.scale(scale, scale);

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

      // Testo
      ctx.fillStyle = placement.level === 0 ? '#fff' : '#000';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        placement.tool_id,
        placement.x + placement.width / 2,
        placement.y + placement.height / 2
      );

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
  const handleZoomOut = () => setZoom(Math.max(zoom / 1.2, 0.5));
  const handleZoomReset = () => setZoom(1);

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
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          {/* Zoom */}
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton size="small" onClick={handleZoomOut}>
              <ZoomOut />
            </IconButton>
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
        </Stack>
      </Paper>

      {/* Canvas container */}
      <Paper 
        ref={containerRef}
        variant="outlined" 
        sx={{ 
          p: 2, 
          overflow: 'auto',
          maxHeight: '60vh',
          backgroundColor: '#fafafa'
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPlacement(null)}
          style={{ 
            display: 'block',
            cursor: 'crosshair',
            imageRendering: 'crisp-edges'
          }}
        />
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