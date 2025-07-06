from dataclasses import dataclass
from typing import List, Optional
from enum import Enum

class LoadStatus(str, Enum):
    DRAFT = "DRAFT"
    READY = "READY"
    IN_CURE = "IN_CURE"
    COMPLETED = "COMPLETED"
    RELEASED = "RELEASED"
    CANCELLED = "CANCELLED"

@dataclass
class Tool:
    id: str
    width: float  # mm
    height: float  # mm
    weight: float  # kg
    
    @property
    def area(self) -> float:
        return self.width * self.height
    
    @property
    def aspect_ratio(self) -> float:
        return max(self.width, self.height) / min(self.width, self.height)

@dataclass
class ODL:
    id: str
    odl_number: str
    part_number: str
    curing_cycle: str
    vacuum_lines: int
    tools: List[Tool]
    
    @property
    def total_area(self) -> float:
        return sum(tool.area for tool in self.tools)
    
    @property
    def total_weight(self) -> float:
        return sum(tool.weight for tool in self.tools)

@dataclass
class Autoclave:
    id: str
    code: str
    width: float  # mm
    height: float  # mm (length in realtà)
    vacuum_lines: int
    max_weight: Optional[float] = None  # kg
    
    @property
    def area(self) -> float:
        return self.width * self.height

@dataclass
class Placement:
    odl_id: str
    tool_id: str
    x: float
    y: float
    width: float
    height: float
    rotated: bool = False
    level: int = 0  # 0 = base, 1 = supporti rialzati

@dataclass
class BatchLayout:
    autoclave_id: str
    placements: List[Placement]
    efficiency: float
    total_weight: float
    vacuum_lines_used: int
    
    @property
    def is_valid(self) -> bool:
        return self.efficiency > 0 and len(self.placements) > 0

@dataclass
class CycleGroup:
    cycle_code: str
    odls: List[ODL]
    total_area: float
    optimization_score: float
    
    @property
    def odl_count(self) -> int:
        return len(self.odls)