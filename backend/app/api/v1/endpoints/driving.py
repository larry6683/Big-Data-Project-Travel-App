from fastapi import APIRouter, HTTPException
from app.services.driving_service import driving_service

router = APIRouter()

@router.get("/route")
async def get_driving_route(origin_lat: float, origin_lon: float, dest_lat: float, dest_lon: float):
    """
    Get driving distance, time, and map geometry between two coordinate points.
    """
    result = await driving_service.get_route(origin_lat, origin_lon, dest_lat, dest_lon)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result