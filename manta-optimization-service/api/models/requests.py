from pydantic import BaseModel, Field
from typing import List, Optional, Dict

class ToolData(BaseModel):
    id: str
    width: float = Field(gt=0, description="Larghezza in mm")
    height: float = Field(gt=0, description="Altezza in mm")
    weight: float = Field(ge=0, description="Peso in kg")

class ODLData(BaseModel):
    id: str
    odl_number: str
    part_number: str
    curing_cycle: str
    vacuum_lines: int = Field(ge=1, le=20)
    tools: List[ToolData]

class AutoclaveData(BaseModel):
    id: str
    code: str
    width: float = Field(gt=0, description="Larghezza in mm")
    height: float = Field(gt=0, description="Lunghezza in mm")
    vacuum_lines: int = Field(ge=1)
    max_weight: Optional[float] = Field(None, gt=0, description="Peso massimo in kg")

class OptimizationConstraints(BaseModel):
    min_border_distance: float = Field(50.0, ge=0, description="Distanza minima dal bordo in mm")
    min_tool_distance: float = Field(30.0, ge=0, description="Distanza minima tra tool in mm")
    allow_rotation: bool = Field(True, description="Permetti rotazione tool")

class AnalysisRequest(BaseModel):
    odls: List[ODLData]
    autoclaves: List[AutoclaveData]
    constraints: OptimizationConstraints = OptimizationConstraints()

class CycleSelectionRequest(BaseModel):
    selected_cycles: List[str]
    elevated_tools: List[str] = Field(default_factory=list)
    constraints: OptimizationConstraints = OptimizationConstraints()

class ExecuteOptimizationRequest(BaseModel):
    odls: List[ODLData]
    autoclaves: List[AutoclaveData]
    selected_cycles: List[str]
    elevated_tools: List[str] = Field(default_factory=list)
    constraints: OptimizationConstraints = OptimizationConstraints()
    autoclave_assignments: Optional[Dict[str, str]] = Field(
        None, 
        description="Assegnazioni manuali ciclo -> autoclave_id (opzionale)"
    )

class ConfirmBatchRequest(BaseModel):
    batch_ids: List[str]
    rejected_batch_ids: List[str] = Field(default_factory=list)