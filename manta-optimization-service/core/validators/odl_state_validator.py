"""
Validatore per stati ODL - previene duplicazioni cross-batch
"""
from typing import List, Dict, Set, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass

from domain.entities import ODL

@dataclass
class ODLStateValidationError:
    """Errore di validazione stato ODL"""
    odl_id: str
    odl_number: str
    error_type: str
    current_batch_id: Optional[str] = None
    current_status: Optional[str] = None
    message: str = ""

@dataclass 
class BatchValidationResult:
    """Risultato validazione batch"""
    is_valid: bool
    errors: List[ODLStateValidationError]
    warnings: List[ODLStateValidationError]
    valid_odls: List[str]
    
    @property
    def has_blocking_errors(self) -> bool:
        """Verifica se ci sono errori che impediscono la creazione batch"""
        blocking_types = ['ALREADY_IN_BATCH', 'ALREADY_IN_AUTOCLAVE', 'LOCKED']
        return any(error.error_type in blocking_types for error in self.errors)

class ODLStateValidator:
    """Validatore per stati ODL e prevenzione duplicazioni"""
    
    def __init__(self):
        # In produzione questo dovrebbe essere collegato al database
        # Per ora simula uno store in-memory per batch attivi
        self._active_batches: Dict[str, Dict] = {}
        self._odl_locks: Dict[str, Dict] = {}
    
    def register_active_batch(
        self, 
        batch_id: str, 
        odl_ids: List[str], 
        autoclave_id: str,
        status: str = 'OPTIMIZATION_PENDING'
    ):
        """Registra un batch attivo nel sistema"""
        self._active_batches[batch_id] = {
            'odl_ids': set(odl_ids),
            'autoclave_id': autoclave_id,
            'status': status,
            'created_at': datetime.now(),
            'locked_until': datetime.now() + timedelta(hours=2)  # Lock temporaneo
        }
        
        # Aggiungi lock sui singoli ODL
        for odl_id in odl_ids:
            self._odl_locks[odl_id] = {
                'batch_id': batch_id,
                'locked_at': datetime.now(),
                'locked_until': datetime.now() + timedelta(hours=2)
            }
    
    def release_batch(self, batch_id: str):
        """Rilascia un batch e rimuove i lock ODL"""
        if batch_id in self._active_batches:
            odl_ids = self._active_batches[batch_id]['odl_ids']
            
            # Rimuovi lock ODL
            for odl_id in odl_ids:
                if odl_id in self._odl_locks:
                    del self._odl_locks[odl_id]
            
            # Rimuovi batch
            del self._active_batches[batch_id]
    
    def validate_odls_for_optimization(
        self, 
        odls: List[ODL],
        target_autoclave_id: Optional[str] = None
    ) -> BatchValidationResult:
        """
        Valida ODL per ottimizzazione, verificando stati e conflitti.
        
        Args:
            odls: Lista ODL da validare
            target_autoclave_id: ID autoclave target (opzionale)
            
        Returns:
            BatchValidationResult con errori/warning e ODL validi
        """
        errors = []
        warnings = []
        valid_odls = []
        
        current_time = datetime.now()
        
        for odl in odls:
            # 1. Verifica se ODL è già in un batch attivo
            if self._is_odl_in_active_batch(odl.id):
                batch_info = self._get_odl_batch_info(odl.id)
                errors.append(ODLStateValidationError(
                    odl_id=odl.id,
                    odl_number=odl.odl_number,
                    error_type='ALREADY_IN_BATCH',
                    current_batch_id=batch_info['batch_id'],
                    current_status=batch_info['status'],
                    message=f"ODL {odl.odl_number} è già incluso nel batch {batch_info['batch_id'][:8]}"
                ))
                continue
            
            # 2. Verifica lock temporanei
            if odl.id in self._odl_locks:
                lock_info = self._odl_locks[odl.id]
                if lock_info['locked_until'] > current_time:
                    errors.append(ODLStateValidationError(
                        odl_id=odl.id,
                        odl_number=odl.odl_number,
                        error_type='LOCKED',
                        current_batch_id=lock_info['batch_id'],
                        message=f"ODL {odl.odl_number} è temporaneamente bloccato fino a {lock_info['locked_until'].strftime('%H:%M')}"
                    ))
                    continue
                else:
                    # Lock scaduto, rimuovi
                    del self._odl_locks[odl.id]
            
            # 3. Verifica compatibilità autoclave (se specificata)
            if target_autoclave_id:
                conflicts = self._check_autoclave_conflicts(odl.id, target_autoclave_id)
                if conflicts:
                    warnings.append(ODLStateValidationError(
                        odl_id=odl.id,
                        odl_number=odl.odl_number,
                        error_type='AUTOCLAVE_CONFLICT',
                        message=f"ODL {odl.odl_number} potrebbe avere conflitti con autoclave {target_autoclave_id}: {conflicts}"
                    ))
            
            # 4. Verifica stato produzione (simulato)
            production_status = self._get_production_status(odl.id)
            if production_status in ['IN_AUTOCLAVE', 'COMPLETED']:
                errors.append(ODLStateValidationError(
                    odl_id=odl.id,
                    odl_number=odl.odl_number,
                    error_type='INVALID_PRODUCTION_STATUS',
                    current_status=production_status,
                    message=f"ODL {odl.odl_number} ha stato produzione incompatibile: {production_status}"
                ))
                continue
            
            # 5. Warning per ODL vicini alla scadenza
            if self._is_near_deadline(odl):
                warnings.append(ODLStateValidationError(
                    odl_id=odl.id,
                    odl_number=odl.odl_number,
                    error_type='NEAR_DEADLINE',
                    message=f"ODL {odl.odl_number} è vicino alla scadenza, priorità alta consigliata"
                ))
            
            # ODL valido
            valid_odls.append(odl.id)
        
        return BatchValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            valid_odls=valid_odls
        )
    
    def _is_odl_in_active_batch(self, odl_id: str) -> bool:
        """Verifica se ODL è in un batch attivo"""
        for batch_id, batch_info in self._active_batches.items():
            if odl_id in batch_info['odl_ids']:
                # Verifica se batch non è scaduto
                if batch_info['locked_until'] > datetime.now():
                    return True
                else:
                    # Batch scaduto, cleanup
                    self.release_batch(batch_id)
        return False
    
    def _get_odl_batch_info(self, odl_id: str) -> Dict:
        """Ottieni info batch per ODL"""
        for batch_id, batch_info in self._active_batches.items():
            if odl_id in batch_info['odl_ids']:
                return {
                    'batch_id': batch_id,
                    'status': batch_info['status'],
                    'autoclave_id': batch_info['autoclave_id']
                }
        return {}
    
    def _check_autoclave_conflicts(self, odl_id: str, autoclave_id: str) -> Optional[str]:
        """Verifica conflitti autoclave per ODL"""
        # Simulazione: controlla se ODL ha vincoli specifici
        # In produzione: query database per vincoli configurati
        
        # Esempio: alcuni ODL potrebbero essere incompatibili con certe autoclavi
        restricted_combinations = {
            'odl_123': ['AC03'],  # ODL non compatibile con AC03
            'odl_456': ['AC01', 'AC02']  # ODL non compatibile con AC01, AC02
        }
        
        if odl_id in restricted_combinations:
            if autoclave_id in restricted_combinations[odl_id]:
                return f"ODL non compatibile con autoclave {autoclave_id}"
        
        return None
    
    def _get_production_status(self, odl_id: str) -> str:
        """Ottieni stato produzione ODL (simulato)"""
        # In produzione: query database per stato reale
        # Per ora simula stati possibili
        statuses = ['READY', 'IN_PREPARATION', 'IN_AUTOCLAVE', 'COMPLETED']
        
        # Simulazione basata su hash ODL per consistenza
        import hashlib
        hash_val = int(hashlib.md5(odl_id.encode()).hexdigest(), 16)
        return statuses[hash_val % len(statuses)]
    
    def _is_near_deadline(self, odl: ODL) -> bool:
        """Verifica se ODL è vicino alla scadenza"""
        # Simulazione: considera scadenza basata su parte del part number
        # In produzione: query database per date scadenza reali
        
        # Se part number contiene numeri alti, simula urgenza
        try:
            numeric_part = ''.join(filter(str.isdigit, odl.part_number))
            if numeric_part and int(numeric_part[-2:]) > 80:
                return True
        except:
            pass
        
        return False
    
    def get_validation_summary(self) -> Dict:
        """Ottieni riepilogo validazione sistema"""
        current_time = datetime.now()
        active_batches = len(self._active_batches)
        active_locks = len([
            lock for lock in self._odl_locks.values() 
            if lock['locked_until'] > current_time
        ])
        
        return {
            'active_batches': active_batches,
            'active_odl_locks': active_locks,
            'system_status': 'HEALTHY' if active_batches < 10 else 'WARNING',
            'validation_timestamp': current_time.isoformat()
        }

# Istanza globale del validator (in produzione usare dependency injection)
odl_validator = ODLStateValidator()