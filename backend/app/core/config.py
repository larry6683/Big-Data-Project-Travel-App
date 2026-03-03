import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    """
    Application Settings
    """
    PROJECT_NAME: str = "Big Data Travel Planner"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str
    
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",  
        "http://localhost:8000",  
    ]

    AMADEUS_CLIENT_ID: str = ""
    AMADEUS_CLIENT_SECRET: str = ""
    WEATHER_API_KEY: str = ""
    OPENSTREETMAP_URL: str = "https://nominatim.openstreetmap.org"

    REDIS_URL: str = "redis://localhost:6379/0"
    POSTGRES_URL: str = "postgresql://user:password@localhost:5432/traveldb"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()