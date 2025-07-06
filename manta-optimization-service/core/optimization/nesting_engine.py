import time
from typing import List, Dict, Tuple, Optional
from ortools.sat.python import cp_model
import math

from domain.entities import Tool, ODL, Autoclave, Placement, BatchLayout
from core.optimization.constraints import NestingConstraints

class NestingEngine:
    """Motore di ottimizzazione per nesting 2D con OR-Tools"""
    
    def __init__(self, constraints: NestingConstraints):
        self.constraints = constraints
    
    def optimize_single_autoclave(
        self,
        odls: List[ODL],
        autoclave: Autoclave,
        elevated_tools: Dict[str, List[str]] = None
    ) -> Optional[BatchLayout]:
        """
        Ottimizza il posizionamento di ODL in un singolo autoclave.
        Usa CP-SAT di Google OR-Tools per risolvere il problema.
        """
        if not odls:
            return None
        
        elevated_tools = elevated_tools or {}
        
        # Prepara items da posizionare
        items = []
        for odl in odls:
            elevated_for_odl = elevated_tools.get(odl.id, [])
            for tool in odl.tools:
                is_elevated = tool.id in elevated_for_odl
                items.append({
                    'odl_id': odl.id,
                    'tool_id': tool.id,
                    'tool': tool,
                    'is_elevated': is_elevated,
                    'vacuum_lines': odl.vacuum_lines
                })
        
        # Risolvi con CP-SAT
        solution = self._solve_with_cpsat(items, autoclave)
        
        if solution and solution.placements:
            return solution
        
        # Fallback: algoritmo greedy se CP-SAT fallisce
        return self._solve_with_greedy(items, autoclave)
    
    def _solve_with_cpsat(
        self,
        items: List[Dict],
        autoclave: Autoclave
    ) -> Optional[BatchLayout]:
        """Risolve il problema di bin packing 2D con Constraint Programming"""
        
        model = cp_model.CpModel()
        
        # Dimensioni autoclave con margini
        max_x = int(autoclave.width - 2 * self.constraints.min_border_distance)
        max_y = int(autoclave.height - 2 * self.constraints.min_border_distance)
        
        # Variabili per ogni item
        positions = []
        rotations = []
        selected = []
        
        for i, item in enumerate(items):
            tool = item['tool']
            
            # Posizione (x, y)
            x_var = model.NewIntVar(0, max_x, f'x_{i}')
            y_var = model.NewIntVar(0, max_y, f'y_{i}')
            
            # Rotazione (0 = no, 1 = 90°)
            if self.constraints.allow_rotation:
                rot_var = model.NewBoolVar(f'rot_{i}')
            else:
                rot_var = model.NewConstant(0)
            
            # Selezione (0 = non incluso, 1 = incluso)
            sel_var = model.NewBoolVar(f'sel_{i}')
            
            positions.append((x_var, y_var))
            rotations.append(rot_var)
            selected.append(sel_var)
        
        # Vincoli di non-sovrapposizione
        for i in range(len(items)):
            for j in range(i + 1, len(items)):
                tool_i = items[i]['tool']
                tool_j = items[j]['tool']
                
                # Calcola dimensioni effettive considerando rotazione
                w_i = model.NewIntVar(0, max(int(tool_i.width), int(tool_i.height)), f'w_{i}')
                h_i = model.NewIntVar(0, max(int(tool_i.width), int(tool_i.height)), f'h_{i}')
                w_j = model.NewIntVar(0, max(int(tool_j.width), int(tool_j.height)), f'w_{j}')
                h_j = model.NewIntVar(0, max(int(tool_j.width), int(tool_j.height)), f'h_{j}')
                
                # Se non ruotato: w = width, h = height
                # Se ruotato: w = height, h = width
                model.Add(w_i == int(tool_i.width)).OnlyEnforceIf(rotations[i].Not())
                model.Add(h_i == int(tool_i.height)).OnlyEnforceIf(rotations[i].Not())
                model.Add(w_i == int(tool_i.height)).OnlyEnforceIf(rotations[i])
                model.Add(h_i == int(tool_i.width)).OnlyEnforceIf(rotations[i])
                
                model.Add(w_j == int(tool_j.width)).OnlyEnforceIf(rotations[j].Not())
                model.Add(h_j == int(tool_j.height)).OnlyEnforceIf(rotations[j].Not())
                model.Add(w_j == int(tool_j.height)).OnlyEnforceIf(rotations[j])
                model.Add(h_j == int(tool_j.width)).OnlyEnforceIf(rotations[j])
                
                # Non-sovrapposizione se entrambi selezionati
                # Almeno una delle seguenti deve essere vera:
                # 1. i è a sinistra di j
                # 2. j è a sinistra di i  
                # 3. i è sopra j
                # 4. j è sopra i
                # 5. Almeno uno non è selezionato
                
                gap = int(self.constraints.min_tool_distance)
                
                left_of = model.NewBoolVar(f'left_{i}_{j}')
                right_of = model.NewBoolVar(f'right_{i}_{j}')
                above_of = model.NewBoolVar(f'above_{i}_{j}')
                below_of = model.NewBoolVar(f'below_{i}_{j}')
                
                model.Add(positions[i][0] + w_i + gap <= positions[j][0]).OnlyEnforceIf(left_of)
                model.Add(positions[j][0] + w_j + gap <= positions[i][0]).OnlyEnforceIf(right_of)
                model.Add(positions[i][1] + h_i + gap <= positions[j][1]).OnlyEnforceIf(above_of)
                model.Add(positions[j][1] + h_j + gap <= positions[i][1]).OnlyEnforceIf(below_of)
                
                # Almeno una condizione deve essere vera se entrambi selezionati
                model.AddBoolOr([
                    left_of, right_of, above_of, below_of,
                    selected[i].Not(), selected[j].Not()
                ])
        
        # Vincoli di contenimento nell'autoclave
        for i, item in enumerate(items):
            tool = item['tool']
            x_var, y_var = positions[i]
            
            # Dimensioni effettive
            w_eff = model.NewIntVar(0, max(int(tool.width), int(tool.height)), f'w_eff_{i}')
            h_eff = model.NewIntVar(0, max(int(tool.width), int(tool.height)), f'h_eff_{i}')
            
            model.Add(w_eff == int(tool.width)).OnlyEnforceIf(rotations[i].Not())
            model.Add(h_eff == int(tool.height)).OnlyEnforceIf(rotations[i].Not())
            model.Add(w_eff == int(tool.height)).OnlyEnforceIf(rotations[i])
            model.Add(h_eff == int(tool.width)).OnlyEnforceIf(rotations[i])
            
            # Deve stare dentro se selezionato
            model.Add(x_var + w_eff <= max_x).OnlyEnforceIf(selected[i])
            model.Add(y_var + h_eff <= max_y).OnlyEnforceIf(selected[i])
        
        # Vincolo linee del vuoto
        total_vacuum_lines = sum(
            item['vacuum_lines'] * selected[i] 
            for i, item in enumerate(items)
        )
        model.Add(total_vacuum_lines <= autoclave.vacuum_lines)
        
        # Obiettivo: massimizzare area utilizzata
        total_area = sum(
            int(item['tool'].area) * selected[i]
            for i, item in enumerate(items)
        )
        model.Maximize(total_area)
        
        # Risolvi
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = min(60, self.constraints.timeout_seconds)
        solver.parameters.num_search_workers = self.constraints.solver_threads
        
        status = solver.Solve(model)
        
        if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            # Estrai soluzione
            placements = []
            total_weight = 0
            vacuum_used = 0
            
            for i, item in enumerate(items):
                if solver.Value(selected[i]):
                    tool = item['tool']
                    x = solver.Value(positions[i][0]) + self.constraints.min_border_distance
                    y = solver.Value(positions[i][1]) + self.constraints.min_border_distance
                    rotated = bool(solver.Value(rotations[i]))
                    
                    if rotated:
                        width, height = tool.height, tool.width
                    else:
                        width, height = tool.width, tool.height
                    
                    placements.append(Placement(
                        odl_id=item['odl_id'],
                        tool_id=item['tool_id'],
                        x=x,
                        y=y,
                        width=width,
                        height=height,
                        rotated=rotated,
                        level=1 if item['is_elevated'] else 0
                    ))
                    
                    total_weight += tool.weight
                    vacuum_used += item['vacuum_lines']
            
            if placements:
                used_area = sum(p.width * p.height for p in placements)
                efficiency = used_area / autoclave.area
                
                return BatchLayout(
                    autoclave_id=autoclave.id,
                    placements=placements,
                    efficiency=round(efficiency, 3),
                    total_weight=round(total_weight, 2),
                    vacuum_lines_used=vacuum_used
                )
        
        return None
    
    def _solve_with_greedy(
        self,
        items: List[Dict],
        autoclave: Autoclave
    ) -> Optional[BatchLayout]:
        """Algoritmo greedy di fallback: Bottom-Left-Fill"""
        
        # Ordina per area decrescente
        sorted_items = sorted(items, key=lambda x: x['tool'].area, reverse=True)
        
        placements = []
        occupied_rects = []
        total_weight = 0
        vacuum_used = 0
        
        border = self.constraints.min_border_distance
        gap = self.constraints.min_tool_distance
        
        for item in sorted_items:
            tool = item['tool']
            
            # Controlla vincolo linee vuoto
            if vacuum_used + item['vacuum_lines'] > autoclave.vacuum_lines:
                continue
            
            # Prova a posizionare con e senza rotazione
            best_position = None
            best_rotated = False
            best_y = float('inf')
            
            for rotated in [False, True] if self.constraints.allow_rotation else [False]:
                if rotated:
                    width, height = tool.height, tool.width
                else:
                    width, height = tool.width, tool.height
                
                # Trova posizione bottom-left
                for y in range(int(border), int(autoclave.height - height - border), 10):
                    for x in range(int(border), int(autoclave.width - width - border), 10):
                        # Verifica non-sovrapposizione
                        rect = (x, y, x + width, y + height)
                        
                        if not any(self._rectangles_overlap(rect, occ, gap) for occ in occupied_rects):
                            if y < best_y:
                                best_position = (x, y)
                                best_rotated = rotated
                                best_y = y
                            break
            
            if best_position:
                x, y = best_position
                if best_rotated:
                    width, height = tool.height, tool.width
                else:
                    width, height = tool.width, tool.height
                
                placements.append(Placement(
                    odl_id=item['odl_id'],
                    tool_id=item['tool_id'],
                    x=x,
                    y=y,
                    width=width,
                    height=height,
                    rotated=best_rotated,
                    level=1 if item['is_elevated'] else 0
                ))
                
                occupied_rects.append((x, y, x + width, y + height))
                total_weight += tool.weight
                vacuum_used += item['vacuum_lines']
        
        if placements:
            used_area = sum(p.width * p.height for p in placements)
            efficiency = used_area / autoclave.area
            
            return BatchLayout(
                autoclave_id=autoclave.id,
                placements=placements,
                efficiency=round(efficiency, 3),
                total_weight=round(total_weight, 2),
                vacuum_lines_used=vacuum_used
            )
        
        return None
    
    def _rectangles_overlap(self, rect1: Tuple, rect2: Tuple, gap: float) -> bool:
        """Verifica se due rettangoli si sovrappongono considerando gap"""
        x1, y1, x2, y2 = rect1
        x3, y3, x4, y4 = rect2
        
        # Espandi rect2 del gap
        x3 -= gap
        y3 -= gap
        x4 += gap
        y4 += gap
        
        # Verifica non-sovrapposizione
        return not (x2 <= x3 or x4 <= x1 or y2 <= y3 or y4 <= y1)