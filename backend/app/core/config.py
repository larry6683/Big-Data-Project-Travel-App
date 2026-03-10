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
    
    # Removed the hardcoded list! Pydantic will now pull this from .env
    BACKEND_CORS_ORIGINS: List[str] 

    AMADEUS_CLIENT_ID: str 
    AMADEUS_CLIENT_SECRET: str 
    WEATHER_API_KEY: str 
    BDC_API_KEY: str  

    # Removed the hardcoded credentials!
    POSTGRES_URL: str 

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()