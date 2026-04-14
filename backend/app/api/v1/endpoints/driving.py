# larry6683/big-data-project-travel-app/backend/app/api/v1/endpoints/driving.py

from fastapi import APIRouter, Query, Depends
from app.services.driving_service import DrivingService
from fastapi_cache.decorator import cache # 🌟 NEW: Imported the Redis cache decorator

router = APIRouter()

@router.get("/route")
@cache(expire=None) # 🌟 NEW: Cache the driving route in Redis for 1 hour (3600 seconds)
async def get_driving_route(
    origin_lat: float,
    origin_lon: float,
    dest_lat: float,
    dest_lon: float,
    service: DrivingService = Depends()
):
    """
    Calculates the driving route between two points. 
    Results are cached in Redis to prevent redundant external API calls.
    """
    return await service.get_route(origin_lat, origin_lon, dest_lat, dest_lon)