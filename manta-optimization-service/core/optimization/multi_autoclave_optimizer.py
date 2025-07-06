import time
import uuid
from typing import List, Dict, Tuple, Optional
from collections import defaultdict
import random

from domain.entities import ODL, Autoclave, BatchLayout
from core.optimization.nesting_engine import NestingEngine
from core.optimization.constraints import NestingConstraints

class MultiAutoclaveOptimizer:
    """Ottimizzatore per distribuzione ODL su multiple autoclavi"""
    
    def __init__(self, constraints: NestingConstraints):
        self.constraints = constraints
        self.nesting_engine = NestingEngine(constraints)
    
    def optimize(
        self,
        odls: List[ODL],
        autoclaves: List[Autoclave],
        elevated_tools: Dict[str, List[str]] = None
    ) -> Tuple[List[BatchLayout], Dict]:
        """
        Ottimizza la distribuzione di ODL su multiple autoclavi.
        
        Returns:
            - Lista di BatchLayout ottimizzati
            - Metriche di performance
        """
        start_time = time.time()
        elevated_tools = elevated_tools or {}
        
        # Raggruppa ODL per ciclo di cura (prerequisito)
        cycle_groups = self._group_by_cycle(odls)
        
        all_batches = []
        metrics = {
            'total_odls_input': len(odls),
            'total_odls_placed': 0,
            'cycles_processed': len(cycle_groups),
            'batches_created': 0
        }
        
        # Processa ogni gruppo di ciclo
        for cycle_code, cycle_odls in cycle_groups.items():
            # Fase 1: Distribuzione iniziale con FFD (First Fit Decreasing)
            initial_distribution = self._first_fit_decreasing(
                cycle_odls, autoclaves
            )
            
            # Fase 2: Ottimizza layout per ogni autoclave
            for autoclave, assigned_odls in initial_distribution.items():
                if not assigned_odls:
                    continue
                
                # Filtra elevated tools per ODL assegnati
                elevated_for_batch = {
                    odl_id: tools
                    for odl_id, tools in elevated_tools.items()
                    if odl_id in [odl.id for odl in assigned_odls]
                }
                
                # Ottimizza con nesting engine
                batch_layout = self.nesting_engine.optimize_single_autoclave(
                    assigned_odls,
                    autoclave,
                    elevated_for_batch
                )
                
                if batch_layout and batch_layout.is_valid:
                    all_batches.append(batch_layout)
                    metrics['total_odls_placed'] += len(set(
                        p.odl_id for p in batch_layout.placements
                    ))
            
            # Fase 3: Ottimizzazione inter-autoclave (swap migliorativi)
            if len(all_batches) > 1:
                all_batches = self._optimize_inter_autoclave(
                    all_batches, cycle_odls, autoclaves, elevated_tools
                )
        
        metrics['batches_created'] = len(all_batches)
        metrics['execution_time'] = round(time.time() - start_time, 2)
        metrics['success_rate'] = round(
            metrics['total_odls_placed'] / metrics['total_odls_input'], 3
        ) if metrics['total_odls_input'] > 0 else 0
        
        return all_batches, metrics
    
    def _group_by_cycle(self, odls: List[ODL]) -> Dict[str, List[ODL]]:
        """Raggruppa ODL per ciclo di cura"""
        groups = defaultdict(list)
        for odl in odls:
            groups[odl.curing_cycle].append(odl)
        return dict(groups)
    
    def _first_fit_decreasing(
        self,
        odls: List[ODL],
        autoclaves: List[Autoclave]
    ) -> Dict[Autoclave, List[ODL]]:
        """
        First Fit Decreasing: assegna ODL più grandi prima.
        Bilancia il carico tra autoclavi.
        """
        # Ordina ODL per area totale decrescente
        sorted_odls = sorted(odls, key=lambda o: o.total_area, reverse=True)
        
        # Inizializza bins (autoclavi)
        distribution = {a: [] for a in autoclaves}
        bin_loads = {a: 0.0 for a in autoclaves}
        
        for odl in sorted_odls:
            # Trova autoclave con minor carico che può contenere l'ODL
            best_autoclave = None
            min_load = float('inf')
            
            for autoclave in autoclaves:
                # Verifica vincoli base
                if odl.vacuum_lines <= autoclave.vacuum_lines:
                    current_load = bin_loads[autoclave]
                    
                    # Stima se c'è spazio (euristica)
                    estimated_usage = (current_load + odl.total_area) / autoclave.area
                    
                    if estimated_usage < 0.9 and current_load < min_load:
                        best_autoclave = autoclave
                        min_load = current_load
            
            if best_autoclave:
                distribution[best_autoclave].append(odl)
                bin_loads[best_autoclave] += odl.total_area
        
        return distribution
    
    def _optimize_inter_autoclave(
        self,
        batches: List[BatchLayout],
        all_odls: List[ODL],
        autoclaves: List[Autoclave],
        elevated_tools: Dict[str, List[str]]
    ) -> List[BatchLayout]:
        """
        Ottimizzazione post-processing: prova swap tra autoclavi
        per migliorare l'efficienza globale.
        """
        # Mappa autoclave_id -> batch
        batch_by_autoclave = {b.autoclave_id: b for b in batches}
        
        # Mappa autoclave_id -> autoclave
        autoclave_by_id = {a.id: a for a in autoclaves}
        
        improved = True
        iterations = 0
        max_iterations = 10
        
        while improved and iterations < max_iterations:
            improved = False
            iterations += 1
            
            # Prova swap casuali
            for _ in range(20):
                # Scegli due batch casuali
                if len(batches) < 2:
                    break
                
                batch1, batch2 = random.sample(batches, 2)
                
                # Scegli ODL casuali da ogni batch
                if not batch1.placements or not batch2.placements:
                    continue
                
                odl1_id = random.choice(batch1.placements).odl_id
                odl2_id = random.choice(batch2.placements).odl_id
                
                # Trova ODL objects
                odl1 = next((o for o in all_odls if o.id == odl1_id), None)
                odl2 = next((o for o in all_odls if o.id == odl2_id), None)
                
                if not odl1 or not odl2:
                    continue
                
                # Calcola efficienza attuale
                current_efficiency = batch1.efficiency + batch2.efficiency
                
                # Simula swap
                # Rimuovi ODL dai batch attuali
                odls1_without = [
                    o for o in all_odls 
                    if any(p.odl_id == o.id for p in batch1.placements) 
                    and o.id != odl1_id
                ]
                odls2_without = [
                    o for o in all_odls 
                    if any(p.odl_id == o.id for p in batch2.placements) 
                    and o.id != odl2_id
                ]
                
                # Aggiungi ODL scambiati
                odls1_new = odls1_without + [odl2]
                odls2_new = odls2_without + [odl1]
                
                # Ri-ottimizza
                autoclave1 = autoclave_by_id[batch1.autoclave_id]
                autoclave2 = autoclave_by_id[batch2.autoclave_id]
                
                new_batch1 = self.nesting_engine.optimize_single_autoclave(
                    odls1_new, autoclave1, elevated_tools
                )
                new_batch2 = self.nesting_engine.optimize_single_autoclave(
                    odls2_new, autoclave2, elevated_tools
                )
                
                if new_batch1 and new_batch2:
                    new_efficiency = new_batch1.efficiency + new_batch2.efficiency
                    
                    # Se migliora, accetta lo swap
                    if new_efficiency > current_efficiency + 0.01:
                        # Aggiorna batches
                        for i, b in enumerate(batches):
                            if b.autoclave_id == batch1.autoclave_id:
                                batches[i] = new_batch1
                            elif b.autoclave_id == batch2.autoclave_id:
                                batches[i] = new_batch2
                        
                        improved = True
                        break
        
        return batches