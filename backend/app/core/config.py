# backend/app/core/config.py
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
    
    # Pydantic will automatically parse a JSON string like '["http://localhost:3000"]' into this list
    BACKEND_CORS_ORIGINS: List[str] 

    AMADEUS_CLIENT_ID: str 
    AMADEUS_CLIENT_SECRET: str 
    WEATHER_API_KEY: str 
    BDC_API_KEY: str  

    POSTGRES_URL: str 
    DUFFEL_API_KEY: str
    
    # Email Settings
    SMTP_SERVER: str = "smtp.gmail.com" # Default for Gmail
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = "" # Add to your .env
    SMTP_PASSWORD: str = "" # Add to your .env (Use App Passwords for Gmail)
    FROM_EMAIL: str = ""    # Add to your .env
    OPENAI_API_KEY: str = ""

    GCP_PROJECT_ID: str = "big-data-project-spring-2026"
    PUBSUB_TOPIC_NAME: str = "prod-trip-notifications"
    
    # 🌟 NEW: Added Mapbox API Key
    MAPBOX_API_KEY: str = "" 
    SERPAPI_KEY: str = "" 
    AIRLABS_API_KEY: str = ""

    GCS_BUCKET_NAME: str = ""

    # Use SettingsConfigDict for Pydantic V2 instead of the inner Config class
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        case_sensitive=True,
        extra="ignore" # This prevents crashes if your .env file has extra variables
    )

settings = Settings()