"""
Endpoint per conferma batch e gestione stati ODL
"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict
from pydantic import BaseModel

from core.validators.odl_state_validator import odl_validator
from api.models.responses import ErrorResponse

router = APIRouter(prefix="/batch", tags=["batch-management"])

class ConfirmBatchRequest(BaseModel):
    """Request per conferma batch"""
    confirmed_batch_ids: List[str]
    rejected_batch_ids: List[str] = []

class BatchConfirmationResponse(BaseModel):
    """Response conferma batch"""
    confirmed_count: int
    rejected_count: int
    released_odl_count: int
    confirmed_batches: List[Dict]
    system_status: Dict

@router.post("/confirm", response_model=BatchConfirmationResponse)
async def confirm_batches(request: ConfirmBatchRequest):
    """
    Conferma batch selezionati e rilascia quelli non confermati.
    
    Questo endpoint:
    1. Conferma i batch selezionati dall'utente
    2. Rilascia automaticamente tutti i batch non confermati
    3. Libera i lock ODL per i batch rifiutati
    4. Aggiorna lo stato dei batch confermati
    """
    try:
        confirmed_batches = []
        released_odl_count = 0
        
        # 1. Processa batch confermati
        for batch_id in request.confirmed_batch_ids:
            # Aggiorna stato batch a CONFIRMED
            # In produzione: update database status
            print(f"Batch {batch_id} confermato per produzione")
            
            confirmed_batches.append({
                'batch_id': batch_id,
                'status': 'CONFIRMED',
                'timestamp': 'now'  # In produzione: timestamp reale
            })
        
        # 2. Rilascia batch non confermati
        all_confirmed = set(request.confirmed_batch_ids)
        all_rejected = set(request.rejected_batch_ids)
        
        # Trova tutti i batch da rilasciare (non confermati + esplicitamente rifiutati)
        batches_to_release = all_rejected.copy()
        
        # In produzione: query database per trovare batch OPTIMIZATION_PENDING
        # e non nella lista confermati
        
        for batch_id in batches_to_release:
            # Rilascia batch e relativi ODL lock
            odl_validator.release_batch(batch_id)
            released_odl_count += 1  # Approssimazione, in produzione: conta ODL reali
            print(f"Batch {batch_id} rilasciato, ODL disponibili per nuova ottimizzazione")
        
        # 3. Ottieni stato sistema dopo operazioni
        system_status = odl_validator.get_validation_summary()
        
        return BatchConfirmationResponse(
            confirmed_count=len(request.confirmed_batch_ids),
            rejected_count=len(batches_to_release),
            released_odl_count=released_odl_count,
            confirmed_batches=confirmed_batches,
            system_status=system_status
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Errore durante conferma batch: {str(e)}"
        )

@router.post("/release/{batch_id}")
async def release_single_batch(batch_id: str):
    """
    Rilascia un singolo batch e i suoi ODL lock.
    Utile per operazioni di cleanup o cancellazione batch.
    """
    try:
        odl_validator.release_batch(batch_id)
        
        return {
            'success': True,
            'message': f'Batch {batch_id} rilasciato con successo',
            'system_status': odl_validator.get_validation_summary()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Errore durante rilascio batch {batch_id}: {str(e)}"
        )

@router.get("/status")
async def get_system_status():
    """
    Ottieni stato del sistema di validazione batch.
    Utile per monitoring e debug.
    """
    try:
        return {
            'status': 'success',
            'data': odl_validator.get_validation_summary()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Errore lettura stato sistema: {str(e)}"
        )

@router.post("/validate-odls")
async def validate_odl_list(odl_ids: List[str]):
    """
    Valida una lista di ODL ID per verificare disponibilità.
    Utile per controlli pre-ottimizzazione dal frontend.
    """
    try:
        # Simula ODL objects per validazione
        # In produzione: query database per creare ODL objects completi
        from domain.entities import ODL
        
        mock_odls = [
            ODL(
                id=odl_id,
                odl_number=f"ODL_{odl_id[:8]}",
                part_number=f"PART_{odl_id[:6]}",
                curing_cycle="CYCLE_A",
                vacuum_lines=2,
                tools=[]
            )
            for odl_id in odl_ids
        ]
        
        validation_result = odl_validator.validate_odls_for_optimization(mock_odls)
        
        return {
            'is_valid': validation_result.is_valid,
            'has_blocking_errors': validation_result.has_blocking_errors,
            'valid_odl_count': len(validation_result.valid_odls),
            'total_odl_count': len(odl_ids),
            'errors': [
                {
                    'odl_id': error.odl_id,
                    'odl_number': error.odl_number,
                    'type': error.error_type,
                    'message': error.message
                }
                for error in validation_result.errors
            ],
            'warnings': [
                {
                    'odl_id': warning.odl_id,
                    'odl_number': warning.odl_number,
                    'type': warning.error_type,
                    'message': warning.message
                }
                for warning in validation_result.warnings
            ]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Errore durante validazione ODL: {str(e)}"
        )