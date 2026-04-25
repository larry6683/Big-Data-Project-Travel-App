import os
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles 
from app.core.config import settings
from app.db.database import engine, Base 
from app.api.v1.endpoints import flights, locations, hotels, driving, activities, attractions, weather, auth, trips, users, chatbot, destinations, health

from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis import asyncio as aioredis

Base.metadata.create_all(bind=engine)


def custom_key_builder(
    func,
    namespace: str = "",
    request: Request = None,
    response: Response = None,
    args: tuple = (),       
    kwargs: dict = None,    
):
    prefix = FastAPICache.get_prefix()
    kwargs = kwargs or {}   
    
    clean_params = [
        f"{k}={v}" for k, v in kwargs.items() 
        if k not in ["request", "response", "db", "self"]
    ]
    params_str = ",".join(clean_params)
    
    key_parts = [prefix]
    
    if namespace and namespace != prefix:
        key_parts.append(namespace)
        
    key_parts.append(func.__name__)
    
    if params_str:
        key_parts.append(params_str)
        
    final_key = ":".join(key_parts)
    final_key = final_key.replace(f"{prefix}:{prefix}", prefix)
    
    return final_key.replace("::", ":")

def get_application():
    _app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

    _app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    os.makedirs("static/profiles", exist_ok=True)
    _app.mount("/static", StaticFiles(directory="static"), name="static")

    _app.include_router(flights.router, prefix="/api/v1/flights", tags=["flights"])
    _app.include_router(locations.router, prefix="/api/v1/locations", tags=["locations"])
    _app.include_router(destinations.router, prefix="/api/v1/destinations", tags=["destinations"])
    
    _app.include_router(driving.router, prefix="/api/v1/driving", tags=["driving"])
    _app.include_router(hotels.router, prefix="/api/v1/hotels", tags=["hotels"])
    _app.include_router(activities.router, prefix="/api/v1/activities", tags=["activities"])
    _app.include_router(attractions.router, prefix="/api/v1/attractions", tags=["attractions"])
    _app.include_router(weather.router, prefix="/api/v1/weather", tags=["weather"])

    _app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
    _app.include_router(trips.router, prefix="/api/v1/trips", tags=["trips"])
    _app.include_router(users.router, prefix="/api/v1/users", tags=["users"]) 
    _app.include_router(chatbot.router, prefix="/api/v1/chatbot", tags=["chatbot"])
    _app.include_router(health.router, prefix="/api/v1/health", tags=["health"])
    
    return _app

app = get_application()

@app.on_event("startup")
async def startup():
    redis_url = os.getenv("REDIS_URL", "redis://redis:6379")
    redis = aioredis.from_url(redis_url, encoding="utf8", decode_responses=False)
    FastAPICache.init(
        RedisBackend(redis), 
        prefix="wanderplan-cache",
        key_builder=custom_key_builder 
    )
    app.state.redis = aioredis.from_url(redis_url, encoding="utf8", decode_responses=True)

@app.get("/")
def root():
    return {"message": "API is operational", "status": "ok"}