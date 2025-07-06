from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Dict
import uuid
import time

from api.models.requests import (
    AnalysisRequest, 
    ExecuteOptimizationRequest,
    ConfirmBatchRequest
)
from api.models.responses import (
    CycleAnalysisResponse,
    CycleGroupResponse,
    ElevatedToolsAnalysisResponse,
    ElevatedToolResponse,
    OptimizationResultResponse,
    BatchLayoutResponse,
    PlacementResponse,
    BatchMetrics,
    ErrorResponse
)
from domain.entities import ODL, Tool, Autoclave, LoadStatus
from core.pre_filters.curing_cycle_filter import CuringCycleFilter
from core.pre_filters.elevated_support_filter import ElevatedSupportFilter
from core.optimization.multi_autoclave_optimizer import MultiAutoclaveOptimizer
from core.optimization.constraints import NestingConstraints
from core.visualization.layout_generator import LayoutGenerator
from core.visualization.export_service import ExportService

router = APIRouter(prefix="/optimization", tags=["optimization"])

# Storage temporaneo per risultati (in produzione usare Redis)
optimization_cache = {}

@router.post("/analyze", response_model=CycleAnalysisResponse)
async def analyze_odls(request: AnalysisRequest):
    """
    Step 1: Analizza ODL e suggerisce cicli di cura ottimali.
    """
    try:
        # Converti request in entities
        odls = []
        for odl_data in request.odls:
            tools = [
                Tool(
                    id=t.id,
                    width=t.width,
                    height=t.height,
                    weight=t.weight
                )
                for t in odl_data.tools
            ]
            
            odls.append(ODL(
                id=odl_data.id,
                odl_number=odl_data.odl_number,
                part_number=odl_data.part_number,
                curing_cycle=odl_data.curing_cycle,
                vacuum_lines=odl_data.vacuum_lines,
                tools=tools
            ))
        
        # Analizza cicli
        cycle_groups, recommendations = CuringCycleFilter.analyze_cycles(odls)
        
        # Prepara response
        cycle_groups_response = [
            CycleGroupResponse(
                cycle_code=group.cycle_code,
                odl_count=group.odl_count,
                total_area=group.total_area,
                optimization_score=group.optimization_score,
                odl_ids=[odl.id for odl in group.odls]
            )
            for group in cycle_groups
        ]
        
        return CycleAnalysisResponse(
            cycle_groups=cycle_groups_response,
            recommendations=recommendations
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-elevated", response_model=ElevatedToolsAnalysisResponse)
async def analyze_elevated_tools(request: AnalysisRequest):
    """
    Step 2: Analizza quali tool posizionare su supporti rialzati.
    """
    try:
        # Converti ODL
        odls = []
        for odl_data in request.odls:
            tools = [
                Tool(
                    id=t.id,
                    width=t.width,
                    height=t.height,
                    weight=t.weight
                )
                for t in odl_data.tools
            ]
            
            odls.append(ODL(
                id=odl_data.id,
                odl_number=odl_data.odl_number,
                part_number=odl_data.part_number,
                curing_cycle=odl_data.curing_cycle,
                vacuum_lines=odl_data.vacuum_lines,
                tools=tools
            ))
        
        # Analizza supporti rialzati
        elevated_by_odl, space_saved = ElevatedSupportFilter.analyze_elevated_candidates(odls)
        recommendations = ElevatedSupportFilter.get_tool_recommendations(odls, elevated_by_odl)
        
        # Prepara response
        elevated_tools_response = [
            ElevatedToolResponse(
                odl_id=rec['odl_id'],
                tool_id=rec['tool_id'],
                width=rec['width'],
                height=rec['height'],
                aspect_ratio=rec['aspect_ratio'],
                area=rec['area'],
                recommendation=rec['recommendation']
            )
            for rec in recommendations
        ]
        
        total_elevated = sum(len(tools) for tools in elevated_by_odl.values())
        
        return ElevatedToolsAnalysisResponse(
            elevated_tools=elevated_tools_response,
            total_elevated=total_elevated,
            space_saved_percentage=space_saved
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/execute", response_model=OptimizationResultResponse)
async def execute_optimization(request: ExecuteOptimizationRequest):
    """
    Step 3: Esegue ottimizzazione multi-autoclave con parametri selezionati.
    """
    try:
        start_time = time.time()
        
        # Converti entities
        odls = []
        for odl_data in request.odls:
            # Filtra solo cicli selezionati
            if odl_data.curing_cycle not in request.selected_cycles:
                continue
                
            tools = [
                Tool(
                    id=t.id,
                    width=t.width,
                    height=t.height,
                    weight=t.weight
                )
                for t in odl_data.tools
            ]
            
            odls.append(ODL(
                id=odl_data.id,
                odl_number=odl_data.odl_number,
                part_number=odl_data.part_number,
                curing_cycle=odl_data.curing_cycle,
                vacuum_lines=odl_data.vacuum_lines,
                tools=tools
            ))
        
        autoclaves = [
            Autoclave(
                id=a.id,
                code=a.code,
                width=a.width,
                height=a.height,
                vacuum_lines=a.vacuum_lines,
                max_weight=a.max_weight
            )
            for a in request.autoclaves
        ]
        
        # Prepara elevated tools mapping
        elevated_tools = {}
        for tool_id in request.elevated_tools:
            # Trova ODL che contiene questo tool
            for odl in odls:
                if any(t.id == tool_id for t in odl.tools):
                    if odl.id not in elevated_tools:
                        elevated_tools[odl.id] = []
                    elevated_tools[odl.id].append(tool_id)
                    break
        
        # Crea constraints
        constraints = NestingConstraints(
            min_border_distance=request.constraints.min_border_distance,
            min_tool_distance=request.constraints.min_tool_distance,
            allow_rotation=request.constraints.allow_rotation
        )
        
        # Ottimizza
        optimizer = MultiAutoclaveOptimizer(constraints)
        batches, metrics = optimizer.optimize(odls, autoclaves, elevated_tools)
        
        # Genera visualizzazioni
        layout_generator = LayoutGenerator()
        autoclave_map = {a.id: a for a in autoclaves}
        
        batch_responses = []
        for i, batch in enumerate(batches):
            batch_id = str(uuid.uuid4())
            autoclave = autoclave_map[batch.autoclave_id]
            
            # Genera immagine
            layout_image = layout_generator.generate_layout_image(
                batch, autoclave, show_coordinates=True, show_metrics=True
            )
            
            # Genera lista coordinate
            coordinates = layout_generator.generate_coordinate_list(batch, autoclave)
            
            # Prepara placements response
            placements_response = []
            for coord in coordinates:
                placement = next(
                    p for p in batch.placements 
                    if p.tool_id == coord['tool_id']
                )
                
                placements_response.append(PlacementResponse(
                    odl_id=placement.odl_id,
                    odl_number=next(o.odl_number for o in odls if o.id == placement.odl_id),
                    tool_id=placement.tool_id,
                    x=placement.x,
                    y=placement.y,
                    width=placement.width,
                    height=placement.height,
                    rotated=placement.rotated,
                    level=placement.level,
                    coordinates_text=coord['instructions']
                ))
            
            # Metriche
            batch_metrics = BatchMetrics(
                area_efficiency=batch.efficiency,
                total_weight=batch.total_weight,
                vacuum_lines_used=batch.vacuum_lines_used,
                odl_count=len(set(p.odl_id for p in batch.placements)),
                tool_count=len(batch.placements),
                wasted_area=(1 - batch.efficiency) * autoclave.area
            )
            
            # Determina ciclo di cura
            curing_cycle = next(
                o.curing_cycle for o in odls 
                if o.id == batch.placements[0].odl_id
            )
            
            batch_response = BatchLayoutResponse(
                batch_id=batch_id,
                autoclave_id=autoclave.id,
                autoclave_code=autoclave.code,
                curing_cycle=curing_cycle,
                placements=placements_response,
                metrics=batch_metrics,
                status=LoadStatus.DRAFT,
                layout_image_base64=layout_image
            )
            
            batch_responses.append(batch_response)
            
            # Salva in cache per export
            optimization_cache[batch_id] = {
                'batch': batch,
                'autoclave': autoclave,
                'layout_image': layout_image
            }
        
        optimization_id = str(uuid.uuid4())
        
        return OptimizationResultResponse(
            optimization_id=optimization_id,
            batches=batch_responses,
            total_odls_placed=metrics['total_odls_placed'],
            total_odls_input=metrics['total_odls_input'],
            success_rate=metrics['success_rate'],
            execution_time_seconds=time.time() - start_time
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/batch/{batch_id}/export/pdf")
async def export_batch_pdf(batch_id: str):
    """
    Esporta batch layout in PDF.
    """
    try:
        if batch_id not in optimization_cache:
            raise HTTPException(status_code=404, detail="Batch not found")
        
        cached_data = optimization_cache[batch_id]
        export_service = ExportService()
        
        pdf_data = export_service.export_to_pdf(
            [cached_data['batch']],
            {cached_data['autoclave'].id: cached_data['autoclave']},
            {cached_data['autoclave'].id: cached_data['layout_image']}
        )
        
        return {
            "filename": f"batch_{batch_id}.pdf",
            "content_base64": base64.b64encode(pdf_data).decode('utf-8'),
            "content_type": "application/pdf"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/batch/{batch_id}/export/dxf")
async def export_batch_dxf(batch_id: str):
    """
    Esporta batch layout in DXF per CAD.
    """
    try:
        if batch_id not in optimization_cache:
            raise HTTPException(status_code=404, detail="Batch not found")
        
        cached_data = optimization_cache[batch_id]
        export_service = ExportService()
        
        dxf_content = export_service.export_to_dxf(
            cached_data['batch'],
            cached_data['autoclave']
        )
        
        return {
            "filename": f"batch_{batch_id}.dxf",
            "content": dxf_content,
            "content_type": "application/dxf"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))