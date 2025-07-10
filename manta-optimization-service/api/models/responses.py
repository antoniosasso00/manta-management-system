from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from domain.entities import LoadStatus

class CycleGroupResponse(BaseModel):
    cycle_code: str
    odl_count: int
    total_area: float = Field(description="Area totale in mm²")
    optimization_score: float = Field(ge=0, le=1)
    odl_ids: List[str]

class AutoclaveSuggestion(BaseModel):
    cycle_code: str
    suggested_autoclave_id: str
    suggested_autoclave_code: str
    reason: str
    odl_count: int
    total_area: float

class CycleAnalysisResponse(BaseModel):
    cycle_groups: List[CycleGroupResponse]
    recommendations: List[str] = Field(description="Cicli consigliati per ottimizzazione")
    autoclave_suggestions: Optional[Dict[str, AutoclaveSuggestion]] = Field(
        None, 
        description="Suggerimenti assegnazione autoclave per ciclo"
    )

class ElevatedToolResponse(BaseModel):
    odl_id: str
    tool_id: str
    width: float
    height: float
    aspect_ratio: float
    area: float
    recommendation: str = Field(description="ELEVATE o GROUND")

class ElevatedToolsAnalysisResponse(BaseModel):
    elevated_tools: List[ElevatedToolResponse]
    total_elevated: int
    space_saved_percentage: float

class PlacementResponse(BaseModel):
    odl_id: str
    odl_number: str
    part_number: str
    part_description: Optional[str] = None
    tool_id: str
    tool_name: Optional[str] = None
    x: float
    y: float
    width: float
    height: float
    rotated: bool
    level: int = Field(0, description="0=base, 1=rialzato")
    coordinates_text: str

class BatchMetrics(BaseModel):
    area_efficiency: float = Field(ge=0, le=1)
    total_weight: float
    vacuum_lines_used: int
    odl_count: int
    tool_count: int
    wasted_area: float

class BatchLayoutResponse(BaseModel):
    batch_id: str
    autoclave_id: str
    autoclave_code: str
    autoclave_dimensions: Optional[Dict[str, float]] = Field(
        None, 
        description="Dimensioni autoclave {width, height}"
    )
    curing_cycle: str
    curing_cycle_description: Optional[str] = None
    curing_time_minutes: Optional[int] = None
    placements: List[PlacementResponse]
    metrics: BatchMetrics
    status: LoadStatus = LoadStatus.DRAFT
    layout_image_base64: Optional[str] = None

class BatchEfficiencyInfo(BaseModel):
    batch_id: str
    efficiency: float
    odl_count: int
    is_recommended: bool

class OptimizationResultResponse(BaseModel):
    optimization_id: str
    batches: List[BatchLayoutResponse]
    total_odls_placed: int
    total_odls_input: int
    success_rate: float
    execution_time_seconds: float
    batches_by_efficiency: Optional[List[BatchEfficiencyInfo]] = Field(
        None,
        description="Batch ordinati per efficienza con flag raccomandazione"
    )

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None