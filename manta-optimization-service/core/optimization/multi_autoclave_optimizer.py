import time
import uuid
from typing import List, Dict, Tuple, Optional
from collections import defaultdict
import random
from dataclasses import dataclass

from domain.entities import ODL, Autoclave, BatchLayout
from core.optimization.nesting_engine import NestingEngine
from core.optimization.constraints import NestingConstraints
from core.validators.odl_state_validator import odl_validator, ODLStateValidationError

@dataclass
class CycleStats:
    """Statistiche per ciclo di cura"""
    cycle_code: str
    odl_count: int
    total_area: float
    odls: List[ODL]
    
    @property
    def normalized_score(self) -> float:
        """Score normalizzato per priorità assegnazione"""
        # Peso maggiore all'area totale rispetto al numero
        return self.total_area * 0.6 + self.odl_count * 1000 * 0.4

@dataclass
class AutoclaveAssignment:
    """Assegnazione autoclave a ciclo"""
    cycle_code: str
    autoclave_id: str
    reason: str
    odl_count: int
    total_area: float

class MultiAutoclaveOptimizer:
    """Ottimizzatore per distribuzione ODL su multiple autoclavi"""
    
    def __init__(self, constraints: NestingConstraints):
        self.constraints = constraints
        self.nesting_engine = NestingEngine(constraints)
    
    def optimize(
        self,
        odls: List[ODL],
        autoclaves: List[Autoclave],
        elevated_tools: Dict[str, List[str]] = None,
        autoclave_assignments: Dict[str, str] = None
    ) -> Tuple[List[BatchLayout], Dict]:
        """
        Ottimizza la distribuzione di ODL su multiple autoclavi.
        
        Args:
            odls: Lista ODL da ottimizzare
            autoclaves: Lista autoclavi disponibili
            elevated_tools: Mapping ODL -> tool rialzati
            autoclave_assignments: Assegnazioni manuali ciclo -> autoclave_id (opzionale)
        
        Returns:
            - Lista di BatchLayout ottimizzati ordinati per efficienza
            - Metriche di performance con suggerimenti
        
        Raises:
            ValueError: Se ODL hanno stati incompatibili o conflitti
        """
        start_time = time.time()
        elevated_tools = elevated_tools or {}
        autoclave_assignments = autoclave_assignments or {}
        
        # VALIDAZIONE STATI ODL - Prevenzione duplicazioni cross-batch
        validation_result = odl_validator.validate_odls_for_optimization(odls)
        
        if validation_result.has_blocking_errors:
            error_messages = [
                f"{error.error_type}: {error.message}"
                for error in validation_result.errors
            ]
            raise ValueError(
                f"Validazione ODL fallita. Errori bloccanti: {'; '.join(error_messages)}"
            )
        
        # Filtra solo ODL validi se ci sono warning non bloccanti
        if validation_result.warnings:
            print(f"Warning validazione ODL: {len(validation_result.warnings)} avvisi")
            for warning in validation_result.warnings:
                print(f"  - {warning.message}")
        
        # Usa solo ODL validati
        valid_odls = [odl for odl in odls if odl.id in validation_result.valid_odls]
        
        if len(valid_odls) != len(odls):
            print(f"Filtrati {len(odls) - len(valid_odls)} ODL non validi. Procedo con {len(valid_odls)} ODL.")
        
        # Analizza cicli e calcola statistiche usando ODL validati
        cycle_stats = self._analyze_cycle_areas(valid_odls)
        
        # Genera assegnazioni autoclavi (automatiche o manuali)
        if not autoclave_assignments:
            autoclave_assignments, suggestions = self._assign_autoclaves_by_area_and_count(
                cycle_stats, autoclaves
            )
        else:
            suggestions = []
        
        all_batches = []
        metrics = {
            'total_odls_input': len(odls),
            'total_odls_valid': len(valid_odls),
            'total_odls_placed': 0,
            'cycles_processed': len(cycle_stats),
            'batches_created': 0,
            'autoclave_suggestions': suggestions,
            'batches_by_efficiency': [],
            'validation_warnings': len(validation_result.warnings),
            'validation_errors': len(validation_result.errors)
        }
        
        # Processa ogni ciclo con la sua autoclave assegnata
        for cycle_code, stats in cycle_stats.items():
            autoclave_id = autoclave_assignments.get(cycle_code)
            if not autoclave_id:
                continue
                
            autoclave = next((a for a in autoclaves if a.id == autoclave_id), None)
            if not autoclave:
                continue
            
            # Crea batch multipli per questa combinazione ciclo-autoclave
            cycle_batches = self._create_multiple_batches_per_autoclave(
                stats.odls, autoclave, elevated_tools
            )
            
            # Aggiungi solo batch validi
            for batch in cycle_batches:
                if batch and batch.is_valid:
                    all_batches.append(batch)
                    metrics['total_odls_placed'] += len(set(
                        p.odl_id for p in batch.placements
                    ))
        
        # Ordina batch per efficienza decrescente
        all_batches = self._rank_batches_by_efficiency(all_batches)
        
        # Registra batch ottimizzati come temporaneamente attivi per prevenire conflitti
        batch_ids = []
        for batch in all_batches:
            batch_id = str(uuid.uuid4())
            batch.batch_id = batch_id  # Assegna ID al batch
            batch_ids.append(batch_id)
            
            # Registra batch nel validator per lock temporaneo
            odl_ids = list(set(p.odl_id for p in batch.placements))
            odl_validator.register_active_batch(
                batch_id=batch_id,
                odl_ids=odl_ids,
                autoclave_id=batch.autoclave_id,
                status='OPTIMIZATION_PENDING'
            )
        
        # Popola metriche di efficienza
        metrics['batches_by_efficiency'] = [
            {
                'batch_id': batch.batch_id,
                'efficiency': batch.efficiency,
                'odl_count': len(set(p.odl_id for p in batch.placements)),
                'is_recommended': batch.efficiency >= 0.7  # Soglia 70%
            }
            for batch in all_batches
        ]
        
        # Aggiungi info sui batch registrati
        metrics['registered_batch_ids'] = batch_ids
        
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
    
    def _analyze_cycle_areas(self, odls: List[ODL]) -> Dict[str, CycleStats]:
        """Analizza superficie totale e conteggio ODL per ogni ciclo"""
        cycle_groups = self._group_by_cycle(odls)
        cycle_stats = {}
        
        for cycle_code, cycle_odls in cycle_groups.items():
            total_area = sum(odl.total_area for odl in cycle_odls)
            cycle_stats[cycle_code] = CycleStats(
                cycle_code=cycle_code,
                odl_count=len(cycle_odls),
                total_area=total_area,
                odls=cycle_odls
            )
        
        return cycle_stats
    
    def _assign_autoclaves_by_area_and_count(
        self, 
        cycle_stats: Dict[str, CycleStats],
        autoclaves: List[Autoclave]
    ) -> Tuple[Dict[str, str], List[AutoclaveAssignment]]:
        """
        Assegna autoclavi ai cicli basandosi su area totale e numero ODL.
        
        Returns:
            - Mapping ciclo -> autoclave_id
            - Lista suggerimenti con motivazioni
        """
        # Ordina cicli per score decrescente (area + count normalizzati)
        sorted_cycles = sorted(
            cycle_stats.values(), 
            key=lambda x: x.normalized_score,
            reverse=True
        )
        
        # Ordina autoclavi per area decrescente
        sorted_autoclaves = sorted(
            autoclaves,
            key=lambda x: x.area,
            reverse=True
        )
        
        assignments = {}
        suggestions = []
        used_autoclaves = set()
        
        # Assegna cicli più "pesanti" ad autoclavi più grandi
        for i, cycle in enumerate(sorted_cycles):
            if i < len(sorted_autoclaves):
                autoclave = sorted_autoclaves[i]
                assignments[cycle.cycle_code] = autoclave.id
                used_autoclaves.add(autoclave.id)
                
                # Genera motivazione
                reason = (
                    f"{cycle.odl_count} ODL, {cycle.total_area:.0f}mm² totali - "
                    f"autoclave {autoclave.code} ({autoclave.width}x{autoclave.height}mm) consigliata"
                )
                
                suggestions.append(AutoclaveAssignment(
                    cycle_code=cycle.cycle_code,
                    autoclave_id=autoclave.id,
                    reason=reason,
                    odl_count=cycle.odl_count,
                    total_area=cycle.total_area
                ))
        
        # Se ci sono più cicli che autoclavi, riusa autoclavi per cicli rimanenti
        if len(sorted_cycles) > len(sorted_autoclaves):
            for i in range(len(sorted_autoclaves), len(sorted_cycles)):
                cycle = sorted_cycles[i]
                # Trova autoclave con più capacità residua (semplificato)
                best_autoclave = sorted_autoclaves[0]  # Default alla più grande
                assignments[cycle.cycle_code] = best_autoclave.id
                
                reason = (
                    f"{cycle.odl_count} ODL, {cycle.total_area:.0f}mm² totali - "
                    f"autoclave {best_autoclave.code} (condivisa) consigliata"
                )
                
                suggestions.append(AutoclaveAssignment(
                    cycle_code=cycle.cycle_code,
                    autoclave_id=best_autoclave.id,
                    reason=reason,
                    odl_count=cycle.odl_count,
                    total_area=cycle.total_area
                ))
        
        return assignments, suggestions
    
    def _first_fit_decreasing(
        self,
        odls: List[ODL],
        autoclaves: List[Autoclave]
    ) -> Dict[str, Tuple[Autoclave, List[ODL]]]:
        """
        First Fit Decreasing ottimizzato per massima efficienza.
        Utilizza Best-Fit con soglia di riempimento alta.
        """
        # Ordina ODL per area totale decrescente
        sorted_odls = sorted(odls, key=lambda o: o.total_area, reverse=True)
        
        # Inizializza bins (autoclavi) usando ID come chiave
        distribution = {a.id: (a, []) for a in autoclaves}
        bin_loads = {a.id: 0.0 for a in autoclaves}
        
        for odl in sorted_odls:
            # Best-Fit: trova autoclave più piena che può ancora contenere l'ODL
            best_autoclave = None
            best_load = -1
            
            for autoclave in autoclaves:
                # Verifica vincoli base
                if odl.vacuum_lines <= autoclave.vacuum_lines:
                    current_load = bin_loads[autoclave.id]
                    
                    # Stima se c'è spazio con soglia più alta per efficienza
                    estimated_usage = (current_load + odl.total_area) / autoclave.area
                    
                    # Usa Best-Fit invece di First-Fit per massimizzare riempimento
                    if estimated_usage < 0.95 and current_load > best_load:
                        best_autoclave = autoclave.id
                        best_load = current_load
            
            if best_autoclave:
                distribution[best_autoclave][1].append(odl)
                bin_loads[best_autoclave] += odl.total_area
        
        return distribution
    
    def _create_multiple_batches_per_autoclave(
        self,
        odls: List[ODL],
        autoclave: Autoclave,
        elevated_tools: Dict[str, List[str]]
    ) -> List[BatchLayout]:
        """
        Crea batch multipli per una combinazione ciclo-autoclave.
        Continua a creare batch finché ci sono ODL da processare.
        """
        # Validazione: verifica che tutti gli ODL abbiano lo stesso ciclo di cura
        if odls:
            first_cycle = odls[0].curing_cycle
            if not all(odl.curing_cycle == first_cycle for odl in odls):
                raise ValueError(
                    f"Tutti gli ODL in un batch devono avere lo stesso ciclo di cura. "
                    f"Trovati cicli diversi: {set(odl.curing_cycle for odl in odls)}"
                )
        
        # Ordina ODL per area decrescente per ottimizzare il packing
        sorted_odls = sorted(odls, key=lambda x: x.total_area, reverse=True)
        remaining_odls = sorted_odls.copy()
        batches = []
        
        # Target di efficienza minima per creare un nuovo batch
        target_efficiency = 0.75
        min_acceptable_efficiency = 0.5
        
        while remaining_odls:
            # Prova a creare un batch con gli ODL rimanenti
            current_batch_odls = []
            batch_elevated_tools = {}
            
            # Usa algoritmo greedy per riempire il batch
            for odl in remaining_odls[:]:
                # Simula aggiunta ODL al batch
                test_odls = current_batch_odls + [odl]
                
                # Prepara elevated tools per test
                test_elevated = batch_elevated_tools.copy()
                if odl.id in elevated_tools:
                    test_elevated[odl.id] = elevated_tools[odl.id]
                
                # Ottimizza con nesting engine
                test_batch = self.nesting_engine.optimize_single_autoclave(
                    test_odls, autoclave, test_elevated
                )
                
                # Se l'aggiunta mantiene efficienza accettabile, aggiungi
                if test_batch and test_batch.is_valid:
                    if (test_batch.efficiency >= target_efficiency or 
                        (test_batch.efficiency >= min_acceptable_efficiency and 
                         len(test_odls) >= 3)):  # Almeno 3 ODL per batch
                        current_batch_odls.append(odl)
                        remaining_odls.remove(odl)
                        if odl.id in elevated_tools:
                            batch_elevated_tools[odl.id] = elevated_tools[odl.id]
            
            # Se abbiamo ODL nel batch corrente, crealo
            if current_batch_odls:
                final_batch = self.nesting_engine.optimize_single_autoclave(
                    current_batch_odls, autoclave, batch_elevated_tools
                )
                if final_batch and final_batch.is_valid:
                    batches.append(final_batch)
            else:
                # Se non riusciamo a creare batch efficiente, prova con meno ODL
                if remaining_odls:
                    # Prendi solo il primo ODL (il più grande)
                    single_odl = [remaining_odls.pop(0)]
                    single_elevated = {}
                    if single_odl[0].id in elevated_tools:
                        single_elevated[single_odl[0].id] = elevated_tools[single_odl[0].id]
                    
                    single_batch = self.nesting_engine.optimize_single_autoclave(
                        single_odl, autoclave, single_elevated
                    )
                    if single_batch and single_batch.is_valid:
                        batches.append(single_batch)
        
        return batches
    
    def _rank_batches_by_efficiency(self, batches: List[BatchLayout]) -> List[BatchLayout]:
        """Ordina batch per efficienza decrescente"""
        return sorted(batches, key=lambda x: x.efficiency, reverse=True)
    
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