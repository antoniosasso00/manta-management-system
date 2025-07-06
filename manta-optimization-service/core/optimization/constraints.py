from dataclasses import dataclass
from typing import Optional

@dataclass
class NestingConstraints:
    """Vincoli per l'algoritmo di nesting"""
    
    # Distanze minime (mm)
    min_border_distance: float = 50.0
    min_tool_distance: float = 30.0
    
    # Rotazione
    allow_rotation: bool = True
    rotation_step: int = 90  # gradi
    
    # Peso
    consider_weight: bool = True
    max_weight_per_level: Optional[float] = None
    
    # Supporti rialzati
    support_height: float = 200.0  # mm
    min_support_spacing: float = 500.0  # mm
    max_elevated_percentage: float = 0.25
    
    # Performance
    timeout_seconds: int = 300
    solver_threads: int = 4
    
    def validate(self) -> bool:
        """Valida i vincoli"""
        return all([
            self.min_border_distance >= 0,
            self.min_tool_distance >= 0,
            self.rotation_step in [90, 180],
            0 <= self.max_elevated_percentage <= 1,
            self.timeout_seconds > 0,
            self.solver_threads > 0
        ])