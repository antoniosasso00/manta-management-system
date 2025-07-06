from dataclasses import dataclass
from typing import Optional

@dataclass
class NestingConstraints:
    """Vincoli per l'algoritmo di nesting"""
    
    # Distanze minime ottimizzate per efficienza (mm)
    min_border_distance: float = 20.0  # Ridotto da 50 a 20mm
    min_tool_distance: float = 15.0   # Ridotto da 30 a 15mm
    
    # Rotazione
    allow_rotation: bool = True
    rotation_step: int = 90  # gradi
    
    # Peso
    consider_weight: bool = True
    max_weight_per_level: Optional[float] = None
    
    # Supporti rialzati ottimizzati
    support_height: float = 150.0  # mm - ridotto per maggiore flessibilità
    min_support_spacing: float = 300.0  # mm - ridotto per densità
    max_elevated_percentage: float = 0.35  # Aumentato da 0.25 a 0.35
    
    # Performance ottimizzata
    timeout_seconds: int = 60  # Ridotto da 300 a 60s per test più rapidi
    solver_threads: int = 6    # Aumentato da 4 a 6 per migliori prestazioni
    
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