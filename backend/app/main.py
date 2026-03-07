from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

from app.db.database import engine, Base 

from app.api.v1.endpoints import flights, locations, hotels, driving, activities, attractions, weather, auth, trips

Base.metadata.create_all(bind=engine)

def get_application():
    _app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

    _app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Core Routes
    _app.include_router(flights.router, prefix="/api/v1/flights", tags=["flights"])
    _app.include_router(locations.router, prefix="/api/v1/locations", tags=["locations"])
    
    # Feature Tab Routes
    _app.include_router(driving.router, prefix="/api/v1/driving", tags=["driving"])
    _app.include_router(hotels.router, prefix="/api/v1/hotels", tags=["hotels"])
    _app.include_router(activities.router, prefix="/api/v1/activities", tags=["activities"])
    _app.include_router(attractions.router, prefix="/api/v1/attractions", tags=["attractions"])
    _app.include_router(weather.router, prefix="/api/v1/weather", tags=["weather"])

    _app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
    _app.include_router(trips.router, prefix="/api/v1/trips", tags=["trips"])
    return _app

app = get_application()

@app.get("/")
def root():
    return {"message": "API is operational", "status": "ok"}