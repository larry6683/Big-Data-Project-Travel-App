import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    """
    Application Settings
    """
    PROJECT_NAME: str = "Big Data Travel Planner"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str
    #Internal
    FRONTEND_URL: str = "http://travel-frontend:3000"
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]
#External API's
    AMADEUS_CLIENT_ID: str 
    AMADEUS_CLIENT_SECRET: str 
    WEATHER_API_KEY: str 
    BDC_API_KEY: str  

    POSTGRES_URL: str 
    DUFFEL_API_KEY: str
    
    SMTP_SERVER: str = "smtp.gmail.com" 
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = "" 
    SMTP_PASSWORD: str = "" 
    FROM_EMAIL: str = ""    
    OPENAI_API_KEY: str = ""

    GCP_PROJECT_ID: str = "big-data-project-spring-2026"
    PUBSUB_TOPIC_NAME: str = "prod-trip-notifications"
    
    MAPBOX_API_KEY: str = "" 
    SERPAPI_KEY: str = "" 
    AIRLABS_API_KEY: str = ""

    GCS_BUCKET_NAME: str = ""

    model_config = SettingsConfigDict(
        env_file=".env.backend", 
        env_file_encoding="utf-8", 
        case_sensitive=True,
        extra="ignore" 
    )

settings = Settings()