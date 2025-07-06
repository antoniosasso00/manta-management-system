from typing import List, Dict, Tuple
from domain.entities import ODL, Tool

class ElevatedSupportFilter:
    """Pre-filter per identificare tool candidati per supporti rialzati"""
    
    # Soglie configurabili
    MIN_AREA_FOR_ELEVATION = 500000  # mm² (50x100 cm)
    MIN_ASPECT_RATIO = 1.5
    ELEVATION_PERCENTAGE = 0.25  # Massimo 25% dei tool può essere rialzato
    
    @staticmethod
    def analyze_elevated_candidates(
        odls: List[ODL],
        custom_percentage: float = None
    ) -> Tuple[Dict[str, List[str]], float]:
        """
        Identifica tool candidati per posizionamento su supporti rialzati.
        
        Criteri:
        - Dimensioni maggiori (area)
        - Aspect ratio elevato (pezzi lunghi e stretti)
        - Peso ragionevole per supporti
        
        Returns:
            - Dict[odl_id, List[tool_id]] dei tool da elevare
            - Percentuale di spazio risparmiato stimata
        """
        # Raccogli tutti i tool con metadati
        tool_candidates = []
        for odl in odls:
            for tool in odl.tools:
                tool_candidates.append({
                    'odl_id': odl.id,
                    'tool_id': tool.id,
                    'tool': tool,
                    'score': ElevatedSupportFilter._calculate_elevation_score(tool)
                })
        
        # Ordina per score decrescente
        tool_candidates.sort(key=lambda x: x['score'], reverse=True)
        
        # Seleziona top N% candidati
        percentage = custom_percentage or ElevatedSupportFilter.ELEVATION_PERCENTAGE
        n_elevated = int(len(tool_candidates) * percentage)
        elevated_candidates = tool_candidates[:n_elevated]
        
        # Organizza per ODL
        elevated_by_odl: Dict[str, List[str]] = {}
        total_elevated_area = 0
        
        for candidate in elevated_candidates:
            odl_id = candidate['odl_id']
            tool_id = candidate['tool_id']
            
            if odl_id not in elevated_by_odl:
                elevated_by_odl[odl_id] = []
            elevated_by_odl[odl_id].append(tool_id)
            
            total_elevated_area += candidate['tool'].area
        
        # Calcola risparmio spazio stimato
        total_area = sum(t['tool'].area for t in tool_candidates)
        space_saved_percentage = (total_elevated_area / total_area * 100) if total_area > 0 else 0
        
        return elevated_by_odl, round(space_saved_percentage, 1)
    
    @staticmethod
    def _calculate_elevation_score(tool: Tool) -> float:
        """
        Calcola score per priorità elevazione basato su:
        - Area (pezzi grandi sono migliori candidati)
        - Aspect ratio (pezzi lunghi/stretti sono migliori)
        - Peso (non troppo pesanti per i supporti)
        """
        # Normalizza area (0-1, dove 1000000 mm² = score 1.0)
        area_score = min(1.0, tool.area / 1000000)
        
        # Aspect ratio score (1.0 = quadrato, >2.0 = molto allungato)
        ar_score = min(1.0, (tool.aspect_ratio - 1.0) / 2.0)
        
        # Peso score (penalizza pezzi troppo pesanti, > 100kg)
        weight_score = max(0, 1.0 - (tool.weight / 100)) if tool.weight > 0 else 0.8
        
        # Bonus per pezzi che superano soglie minime
        threshold_bonus = 0
        if tool.area >= ElevatedSupportFilter.MIN_AREA_FOR_ELEVATION:
            threshold_bonus += 0.2
        if tool.aspect_ratio >= ElevatedSupportFilter.MIN_ASPECT_RATIO:
            threshold_bonus += 0.1
        
        # Score finale
        score = (
            area_score * 0.4 +
            ar_score * 0.3 +
            weight_score * 0.2 +
            threshold_bonus
        )
        
        return round(score, 3)
    
    @staticmethod
    def get_tool_recommendations(
        odls: List[ODL],
        elevated_tool_ids: Dict[str, List[str]]
    ) -> List[Dict]:
        """
        Genera raccomandazioni dettagliate per ogni tool.
        """
        recommendations = []
        
        for odl in odls:
            elevated_for_odl = elevated_tool_ids.get(odl.id, [])
            
            for tool in odl.tools:
                is_elevated = tool.id in elevated_for_odl
                
                recommendations.append({
                    'odl_id': odl.id,
                    'tool_id': tool.id,
                    'width': tool.width,
                    'height': tool.height,
                    'aspect_ratio': round(tool.aspect_ratio, 2),
                    'area': tool.area,
                    'weight': tool.weight,
                    'recommendation': 'ELEVATE' if is_elevated else 'GROUND',
                    'elevation_score': ElevatedSupportFilter._calculate_elevation_score(tool)
                })
        
        return recommendations