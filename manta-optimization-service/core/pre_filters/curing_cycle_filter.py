from typing import List, Dict, Tuple
from collections import defaultdict
import math

from domain.entities import ODL, CycleGroup

class CuringCycleFilter:
    """Pre-filter per raggruppare e analizzare ODL per ciclo di cura"""
    
    @staticmethod
    def analyze_cycles(odls: List[ODL]) -> Tuple[List[CycleGroup], List[str]]:
        """
        Raggruppa ODL per ciclo di cura e calcola score di ottimizzazione.
        
        Returns:
            - Lista di CycleGroup con metriche
            - Lista di cicli raccomandati (top performers)
        """
        # Raggruppa per ciclo
        cycle_groups: Dict[str, List[ODL]] = defaultdict(list)
        for odl in odls:
            cycle_groups[odl.curing_cycle].append(odl)
        
        # Calcola metriche per ogni gruppo
        groups = []
        for cycle_code, cycle_odls in cycle_groups.items():
            total_area = sum(odl.total_area for odl in cycle_odls)
            optimization_score = CuringCycleFilter._calculate_optimization_score(
                cycle_odls, total_area
            )
            
            groups.append(CycleGroup(
                cycle_code=cycle_code,
                odls=cycle_odls,
                total_area=total_area,
                optimization_score=optimization_score
            ))
        
        # Ordina per score e seleziona raccomandazioni
        groups.sort(key=lambda g: g.optimization_score, reverse=True)
        
        # Raccomanda cicli con score > 0.6 o top 3
        recommendations = []
        for group in groups:
            if group.optimization_score > 0.6 or len(recommendations) < 3:
                recommendations.append(group.cycle_code)
        
        return groups, recommendations
    
    @staticmethod
    def _calculate_optimization_score(odls: List[ODL], total_area: float) -> float:
        """
        Calcola score di ottimizzazione basato su:
        - Numero di pezzi (più pezzi = migliore)
        - Uniformità dimensioni (meno varianza = migliore)
        - Densità potenziale (area totale / numero pezzi)
        """
        if not odls:
            return 0.0
        
        # Fattore quantità (normalizzato su scala logaritmica)
        quantity_factor = min(1.0, math.log(len(odls) + 1) / math.log(20))
        
        # Fattore uniformità (basato su deviazione standard delle aree)
        areas = [odl.total_area for odl in odls]
        mean_area = sum(areas) / len(areas)
        
        if len(areas) > 1:
            variance = sum((a - mean_area) ** 2 for a in areas) / len(areas)
            std_dev = math.sqrt(variance)
            cv = std_dev / mean_area if mean_area > 0 else 1.0
            uniformity_factor = max(0, 1.0 - cv)
        else:
            uniformity_factor = 0.8
        
        # Fattore densità (pezzi piccoli sono migliori per nesting)
        avg_area_per_piece = total_area / len(odls)
        # Normalizza su scala dove 100000 mm² è considerato "grande"
        density_factor = max(0, 1.0 - (avg_area_per_piece / 100000))
        
        # Score finale (media pesata)
        score = (
            quantity_factor * 0.4 +
            uniformity_factor * 0.3 +
            density_factor * 0.3
        )
        
        return round(score, 3)
    
    @staticmethod
    def filter_by_selected_cycles(
        odls: List[ODL], 
        selected_cycles: List[str]
    ) -> List[ODL]:
        """Filtra ODL mantenendo solo quelli con cicli selezionati"""
        return [odl for odl in odls if odl.curing_cycle in selected_cycles]