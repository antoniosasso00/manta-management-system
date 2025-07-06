from fastapi import APIRouter
from datetime import datetime
import platform
import sys

from core.config import settings

router = APIRouter(prefix="/health", tags=["health"])

@router.get("/")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.api_title,
        "version": settings.api_version,
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/info")
async def service_info():
    """Detailed service information."""
    return {
        "service": {
            "name": settings.api_title,
            "version": settings.api_version,
            "description": settings.api_description
        },
        "environment": {
            "python_version": sys.version,
            "platform": platform.platform(),
            "processor": platform.processor()
        },
        "configuration": {
            "cors_origins": settings.cors_origins,
            "solver_threads": settings.solver_threads,
            "timeout_seconds": settings.default_timeout_seconds,
            "constraints": {
                "min_border_distance": settings.default_min_border_distance,
                "min_tool_distance": settings.default_min_tool_distance
            }
        },
        "capabilities": [
            "multi_autoclave_optimization",
            "curing_cycle_analysis", 
            "elevated_support_detection",
            "2d_layout_visualization",
            "pdf_export",
            "dxf_export"
        ]
    }