from fastapi import APIRouter
from typing import List
from app.services.location_service import location_service
from app.schemas.location import Location
from app.core.cache import get_top_trending

router = APIRouter()

@router.get("/search", response_model=List[Location])
async def search_locations(keyword: str):
    """
    Autocomplete search for cities/airports.
    User types "Hyd" -> Returns Hyderabad (HYD).
    """
    return await location_service.search_locations(keyword)



@router.get("/nearby")
async def get_nearby_airports(lat: float, lon: float, radius: int = 100):
    """
    Get airports near specific GPS coordinates.
    """
    result = await location_service.get_airports_by_location(lat, lon, radius)
    return result

@router.get("/trending")
async def get_trending_stats():
    """
    Returns the top 3 most searched destinations and routes instantly.
    """
    top_dests = get_top_trending("top_destinations", limit=3)
    top_routes = get_top_trending("top_routes", limit=3)
    
    return {
        "top_destinations": top_dests,
        "top_routes": top_routes
    }