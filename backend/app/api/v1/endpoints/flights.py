from fastapi import APIRouter, HTTPException, Query
from typing import List
from app.services.flight_service import flight_service
from app.schemas.flight import FlightOffer
from app.core.cache import increment_trending

router = APIRouter()

@router.get("/search", response_model=List[FlightOffer])
async def search_flights(
    origin: str = Query(..., description="Departure airport IATA code (e.g., JFK)"),
    destination: str = Query(..., description="Arrival airport IATA code (e.g., LHR)"),
    date: str = Query(..., description="Departure date YYYY-MM-DD"),
    return_date: str = Query(..., description="Return date YYYY-MM-DD"),
    adults: int = Query(..., description="Number of adult passengers"),
    travel_class: str = Query("ECONOMY", description="Cabin class: ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST"),
    children: int = Query(0, description="Number of children (Optional)")
):
    """
    Search for round-trip flights.
    """
    
    increment_trending("top_destinations", destination.lower())
    increment_trending("top_routes", f"{origin.lower()}_to_{destination.lower()}")

    result = await flight_service.search_flights(
        origin=origin,
        destination=destination,
        date=date,
        return_date=return_date,
        adults=adults,
        travel_class=travel_class,
        children=children
    )
    
    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return result