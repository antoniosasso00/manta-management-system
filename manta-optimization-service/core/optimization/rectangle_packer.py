"""
Algoritmo Specializzato per Rectangle Packing
==============================================

Implementa algoritmi ottimizzati specificatamente per forme rettangolari,
che sono molto più efficienti del constraint programming generico.
"""

from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
import bisect

from domain.entities import Tool, ODL, Autoclave, Placement, BatchLayout
from core.optimization.constraints import NestingConstraints

@dataclass
class Rectangle:
    """Rappresenta un rettangolo da posizionare"""
    width: float
    height: float
    odl_id: str
    tool_id: str
    tool: Tool
    vacuum_lines: int
    is_elevated: bool = False
    rotated: bool = False
    
    @property
    def area(self) -> float:
        return self.width * self.height

@dataclass
class Position:
    """Posizione di un rettangolo"""
    x: float
    y: float
    width: float
    height: float

class Skyline:
    """
    Algoritmo Skyline per rectangle packing.
    Più efficiente di CP-SAT per rettangoli regolari.
    """
    
    def __init__(self, container_width: float, container_height: float, constraints: NestingConstraints):
        self.container_width = container_width
        self.container_height = container_height
        self.constraints = constraints
        
        # Skyline: lista di punti (x, y) che rappresentano l'orizzonte
        self.skyline = [(0, 0), (container_width, 0)]
        
        # Rettangoli posizionati
        self.placed_rectangles: List[Tuple[Rectangle, Position]] = []
        
        # Margini
        self.border = constraints.min_border_distance
        self.gap = constraints.min_tool_distance
        
        # Area disponibile (con margini)
        self.available_width = container_width - 2 * self.border
        self.available_height = container_height - 2 * self.border
    
    def can_place(self, rect: Rectangle, x: float, y: float) -> bool:
        """Verifica se un rettangolo può essere posizionato in una posizione"""
        
        # Verifica bounds
        if x + rect.width > self.available_width + self.border:
            return False
        if y + rect.height > self.available_height + self.border:
            return False
        
        # Verifica sovrapposizioni con gap
        new_rect_bounds = (x, y, x + rect.width, y + rect.height)
        
        for _, pos in self.placed_rectangles:
            existing_bounds = (
                pos.x - self.gap, 
                pos.y - self.gap,
                pos.x + pos.width + self.gap,
                pos.y + pos.height + self.gap
            )
            
            if self._rectangles_overlap(new_rect_bounds, existing_bounds):
                return False
        
        return True
    
    def _rectangles_overlap(self, rect1: Tuple, rect2: Tuple) -> bool:
        """Verifica sovrapposizione tra due rettangoli"""
        x1, y1, x2, y2 = rect1
        x3, y3, x4, y4 = rect2
        return not (x2 <= x3 or x4 <= x1 or y2 <= y3 or y4 <= y1)
    
    def find_best_position(self, rect: Rectangle) -> Optional[Tuple[float, float]]:
        """
        Trova la migliore posizione per un rettangolo usando Bottom-Left-Fill.
        """
        best_position = None
        best_y = float('inf')
        best_x = float('inf')
        
        # Prova tutte le posizioni sulla skyline
        for i in range(len(self.skyline) - 1):
            x = self.skyline[i][0]
            
            if x + rect.width > self.container_width - self.border:
                continue
            
            # Trova l'altezza massima in questo intervallo
            y = self._get_skyline_height(x, x + rect.width)
            
            # Verifica se può essere posizionato
            if self.can_place(rect, x, y):
                # Bottom-Left-Fill: preferisci posizioni più basse e più a sinistra
                if y < best_y or (y == best_y and x < best_x):
                    best_position = (x, y)
                    best_y = y
                    best_x = x
        
        return best_position
    
    def _get_skyline_height(self, x_start: float, x_end: float) -> float:
        """Ottiene l'altezza massima della skyline in un intervallo"""
        max_height = 0
        
        for i in range(len(self.skyline) - 1):
            seg_start = self.skyline[i][0]
            seg_end = self.skyline[i + 1][0]
            seg_height = self.skyline[i][1]
            
            # Se il segmento si sovrappone con l'intervallo
            if seg_start < x_end and seg_end > x_start:
                max_height = max(max_height, seg_height)
        
        return max_height
    
    def place_rectangle(self, rect: Rectangle) -> bool:
        """Posiziona un rettangolo sulla skyline"""
        
        position = self.find_best_position(rect)
        if not position:
            return False
        
        x, y = position
        
        # Crea posizione
        pos = Position(x, y, rect.width, rect.height)
        self.placed_rectangles.append((rect, pos))
        
        # Aggiorna skyline
        self._update_skyline(x, y, rect.width, rect.height)
        
        return True
    
    def _update_skyline(self, x: float, y: float, width: float, height: float):
        """Aggiorna la skyline dopo aver posizionato un rettangolo"""
        
        # Trova i segmenti che si sovrappongono
        x_start = x
        x_end = x + width
        new_height = y + height
        
        # Rimuovi i segmenti sovrappost e trova altezza minima
        min_height = float('inf')
        to_remove = []
        
        for i, (seg_x, seg_y) in enumerate(self.skyline[:-1]):
            seg_x_end = self.skyline[i + 1][0]
            
            if seg_x >= x_end:
                break
            if seg_x_end <= x_start:
                continue
            
            min_height = min(min_height, seg_y)
            
            # Segmento completamente coperto
            if seg_x >= x_start and seg_x_end <= x_end:
                to_remove.append(i)
            # Segmento parzialmente coperto a sinistra
            elif seg_x < x_start and seg_x_end > x_start:
                # Mantieni la parte sinistra
                pass
            # Segmento parzialmente coperto a destra  
            elif seg_x < x_end and seg_x_end > x_end:
                # Mantieni la parte destra
                pass
        
        # Rimuovi segmenti coperti (in ordine inverso)
        for i in reversed(to_remove):
            del self.skyline[i]
        
        # Inserisci nuovi punti
        new_points = []
        
        # Punto iniziale del rettangolo
        if x_start > 0:
            new_points.append((x_start, new_height))
        
        # Punto finale del rettangolo
        new_points.append((x_end, min_height))
        
        # Inserisci i nuovi punti nella skyline
        for point in new_points:
            pos = bisect.bisect_left([(x, y) for x, y in self.skyline], point)
            self.skyline.insert(pos, point)
        
        # Rimuovi punti ridondanti
        self._clean_skyline()
    
    def _clean_skyline(self):
        """Rimuove punti ridondanti dalla skyline"""
        if len(self.skyline) <= 2:
            return
        
        cleaned = [self.skyline[0]]
        
        for i in range(1, len(self.skyline) - 1):
            prev_y = cleaned[-1][1]
            curr_y = self.skyline[i][1]
            next_y = self.skyline[i + 1][1]
            
            # Mantieni solo i punti che cambiano altezza
            if curr_y != prev_y or curr_y != next_y:
                cleaned.append(self.skyline[i])
        
        cleaned.append(self.skyline[-1])
        self.skyline = cleaned

class RectanglePacker:
    """
    Packer specializzato per rettangoli.
    Molto più efficiente di CP-SAT per forme regolari.
    """
    
    def __init__(self, constraints: NestingConstraints):
        self.constraints = constraints
    
    def pack_rectangles(
        self,
        odls: List[ODL],
        autoclave: Autoclave,
        elevated_tools: Dict[str, List[str]] = None
    ) -> Optional[BatchLayout]:
        """Packa rettangoli in un autoclave"""
        
        if not odls:
            return None
        
        elevated_tools = elevated_tools or {}
        
        # Prepara rettangoli
        rectangles = []
        total_vacuum = 0
        
        for odl in odls:
            elevated_for_odl = elevated_tools.get(odl.id, [])
            
            for tool in odl.tools:
                is_elevated = tool.id in elevated_for_odl
                
                # Crea rettangoli con e senza rotazione
                options = []
                
                # Orientazione normale
                options.append(Rectangle(
                    width=tool.width,
                    height=tool.height,
                    odl_id=odl.id,
                    tool_id=tool.id,
                    tool=tool,
                    vacuum_lines=odl.vacuum_lines,
                    is_elevated=is_elevated,
                    rotated=False
                ))
                
                # Orientazione ruotata (se permessa e diversa)
                if self.constraints.allow_rotation and tool.width != tool.height:
                    options.append(Rectangle(
                        width=tool.height,
                        height=tool.width,
                        odl_id=odl.id,
                        tool_id=tool.id,
                        tool=tool,
                        vacuum_lines=odl.vacuum_lines,
                        is_elevated=is_elevated,
                        rotated=True
                    ))
                
                rectangles.extend(options)
        
        # Ordina per area decrescente (First Fit Decreasing)
        rectangles.sort(key=lambda r: r.area, reverse=True)
        
        # Inizializza skyline
        skyline = Skyline(autoclave.width, autoclave.height, self.constraints)
        
        # Posiziona rettangoli
        placed = []
        vacuum_used = 0
        weight_used = 0
        
        # Traccia quali ODL/tool sono già stati posizionati
        placed_tools = set()
        
        for rect in rectangles:
            tool_key = (rect.odl_id, rect.tool_id)
            
            # Salta se questo tool è già stato posizionato
            if tool_key in placed_tools:
                continue
            
            # Verifica vincoli vacuum
            if vacuum_used + rect.vacuum_lines > autoclave.vacuum_lines:
                continue
            
            # Prova a posizionare
            if skyline.place_rectangle(rect):
                placed.append(rect)
                placed_tools.add(tool_key)
                vacuum_used += rect.vacuum_lines
                weight_used += rect.tool.weight
        
        if not placed:
            return None
        
        # Crea placements
        placements = []
        total_area_used = 0
        
        for rect, pos in skyline.placed_rectangles:
            if rect in placed:
                placements.append(Placement(
                    odl_id=rect.odl_id,
                    tool_id=rect.tool_id,
                    x=pos.x,
                    y=pos.y,
                    width=pos.width,
                    height=pos.height,
                    rotated=rect.rotated,
                    level=1 if rect.is_elevated else 0
                ))
                total_area_used += pos.width * pos.height
        
        # Calcola efficienza
        efficiency = total_area_used / autoclave.area
        
        return BatchLayout(
            autoclave_id=autoclave.id,
            placements=placements,
            efficiency=round(efficiency, 3),
            total_weight=round(weight_used, 2),
            vacuum_lines_used=vacuum_used
        )