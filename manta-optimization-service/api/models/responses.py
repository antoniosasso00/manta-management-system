from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from domain.entities import LoadStatus

class CycleGroupResponse(BaseModel):
    cycle_code: str
    odl_count: int
    total_area: float = Field(description="Area totale in mm²")
    optimization_score: float = Field(ge=0, le=1)
    odl_ids: List[str]

class CycleAnalysisResponse(BaseModel):
    cycle_groups: List[CycleGroupResponse]
    recommendations: List[str] = Field(description="Cicli consigliati per ottimizzazione")

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
    tool_id: str
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
    curing_cycle: str
    placements: List[PlacementResponse]
    metrics: BatchMetrics
    status: LoadStatus = LoadStatus.DRAFT
    layout_image_base64: Optional[str] = None

class OptimizationResultResponse(BaseModel):
    optimization_id: str
    batches: List[BatchLayoutResponse]
    total_odls_placed: int
    total_odls_input: int
    success_rate: float
    execution_time_seconds: float

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None