from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # API Configuration
    api_title: str = "MES Optimization Service"
    api_version: str = "1.0.0"
    api_description: str = "Servizio di ottimizzazione batch autoclavi per MES Aerospazio"
    
    # Service Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True
    
    # CORS Settings
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    # Optimization Parameters
    default_min_border_distance: float = 50.0  # mm
    default_min_tool_distance: float = 30.0    # mm
    default_timeout_seconds: int = 300         # 5 minuti per ottimizzazioni complesse
    
    # Solver Configuration
    solver_threads: int = 4
    solver_time_limit_ms: int = 60000  # 1 minuto per solver
    
    # Visualization
    dpi: int = 150
    default_color_scheme: str = "aerospace"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()