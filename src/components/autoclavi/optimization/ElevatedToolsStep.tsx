'use client';

import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Checkbox,
  FormControlLabel,
  Chip,
  Stack,
  Alert,
  Paper,
  Button,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  IconButton,
} from '@mui/material';
import {
  Height,
  AspectRatio,
  Square,
  ArrowUpward,
  ArrowDownward,
  Info,
  CheckBox,
  CheckBoxOutlineBlank,
} from '@mui/icons-material';
import { useState } from 'react';
import type { ElevatedTool } from '@/services/optimization-service';

interface ElevatedToolsStepProps {
  elevatedTools: ElevatedTool[];
  selectedElevatedTools: string[];
  setSelectedElevatedTools: (tools: string[]) => void;
}

type OrderBy = 'area' | 'aspect_ratio' | 'recommendation';
type Order = 'asc' | 'desc';

export function ElevatedToolsStep({
  elevatedTools,
  selectedElevatedTools,
  setSelectedElevatedTools,
}: ElevatedToolsStepProps) {
  const [orderBy, setOrderBy] = useState<OrderBy>('area');
  const [order, setOrder] = useState<Order>('desc');

  const handleToolToggle = (toolId: string) => {
    setSelectedElevatedTools(
      selectedElevatedTools.includes(toolId)
        ? selectedElevatedTools.filter(id => id !== toolId)
        : [...selectedElevatedTools, toolId]
    );
  };

  const handleSelectAll = () => {
    if (selectedElevatedTools.length === elevatedTools.length) {
      setSelectedElevatedTools([]);
    } else {
      setSelectedElevatedTools(elevatedTools.map(t => t.tool_id));
    }
  };

  const handleSelectRecommended = () => {
    const recommended = elevatedTools
      .filter(t => t.recommendation === 'ELEVATE')
      .map(t => t.tool_id);
    setSelectedElevatedTools(recommended);
  };

  const handleSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedTools = [...elevatedTools].sort((a, b) => {
    let aValue: any = a[orderBy];
    let bValue: any = b[orderBy];

    if (orderBy === 'recommendation') {
      aValue = a.recommendation === 'ELEVATE' ? 1 : 0;
      bValue = b.recommendation === 'ELEVATE' ? 1 : 0;
    }

    if (order === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const elevatedCount = selectedElevatedTools.length;
  const totalTools = elevatedTools.length;
  const recommendedCount = elevatedTools.filter(t => t.recommendation === 'ELEVATE').length;

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Il sistema ha identificato i tool candidati per il posizionamento su supporti rialzati.
          Questo permette di utilizzare due livelli nell'autoclave, aumentando l'efficienza.
          I tool con area maggiore e aspect ratio elevato sono i candidati migliori.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* Statistiche */}
        <Grid size={12}>
          <Stack direction="row" spacing={2}>
            <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
              <Typography variant="h4" color="primary">
                {elevatedCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tool selezionati per elevazione
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
              <Typography variant="h4" color="secondary">
                {recommendedCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tool raccomandati dal sistema
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
              <Typography variant="h4">
                {((elevatedCount / totalTools) * 100).toFixed(0)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Percentuale di elevazione
              </Typography>
            </Paper>
          </Stack>
        </Grid>

        {/* Controlli */}
        <Grid size={12}>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              onClick={handleSelectAll}
              startIcon={selectedElevatedTools.length === totalTools ? <CheckBoxOutlineBlank /> : <CheckBox />}
            >
              {selectedElevatedTools.length === totalTools ? 'Deseleziona tutti' : 'Seleziona tutti'}
            </Button>
            <Button
              variant="contained"
              onClick={handleSelectRecommended}
              color="primary"
            >
              Seleziona Raccomandati ({recommendedCount})
            </Button>
          </Stack>
        </Grid>

        {/* Tabella Tool */}
        <Grid size={12}>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selectedElevatedTools.length > 0 &&
                        selectedElevatedTools.length < totalTools
                      }
                      checked={selectedElevatedTools.length === totalTools}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>ODL / Tool</TableCell>
                  <TableCell align="right">Dimensioni (mm)</TableCell>
                  <TableCell align="right" sortDirection={orderBy === 'area' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'area'}
                      direction={orderBy === 'area' ? order : 'asc'}
                      onClick={() => handleSort('area')}
                    >
                      Area (m²)
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sortDirection={orderBy === 'aspect_ratio' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'aspect_ratio'}
                      direction={orderBy === 'aspect_ratio' ? order : 'asc'}
                      onClick={() => handleSort('aspect_ratio')}
                    >
                      Aspect Ratio
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center" sortDirection={orderBy === 'recommendation' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'recommendation'}
                      direction={orderBy === 'recommendation' ? order : 'asc'}
                      onClick={() => handleSort('recommendation')}
                    >
                      Raccomandazione
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedTools.map((tool, index) => {
                  const isSelected = selectedElevatedTools.includes(tool.tool_id);
                  const isRecommended = tool.recommendation === 'ELEVATE';

                  return (
                    <TableRow
                      key={`${tool.tool_id}-${index}`}
                      hover
                      selected={isSelected}
                      onClick={() => handleToolToggle(tool.tool_id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox checked={isSelected} />
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography variant="body2">
                            {tool.odl_id.substring(0, 10)}...
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Tool: {tool.tool_id}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Chip
                            icon={<Square fontSize="small" />}
                            label={`${tool.width} × ${tool.height}`}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {(tool.area / 1000000).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          icon={<AspectRatio fontSize="small" />}
                          label={tool.aspect_ratio.toFixed(2)}
                          size="small"
                          color={tool.aspect_ratio > 2 ? 'primary' : 'default'}
                          variant={tool.aspect_ratio > 2 ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {isRecommended ? (
                          <Chip
                            icon={<ArrowUpward fontSize="small" />}
                            label="ELEVA"
                            color="success"
                            size="small"
                          />
                        ) : (
                          <Chip
                            icon={<ArrowDownward fontSize="small" />}
                            label="BASE"
                            color="default"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Info aggiuntive */}
        <Grid size={12}>
          <Alert severity="success">
            <Typography variant="body2">
              Selezionando {elevatedCount} tool per i supporti rialzati, 
              si libera circa il {((elevatedCount / totalTools) * 25).toFixed(0)}% 
              di spazio aggiuntivo sul livello base dell'autoclave.
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
}