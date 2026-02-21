from fastapi import APIRouter, HTTPException
from typing import List
from app.services.flight_service import flight_service
from app.schemas.flight import FlightOffer 

router = APIRouter()

@router.get("/search", response_model=List[FlightOffer])
async def search_flights(origin: str, destination: str, date: str):
    """
    Search for flights and return CLEAN data.
    """
    result = await flight_service.search_flights(origin, destination, date)
    
    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return result