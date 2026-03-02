from fastapi import APIRouter, HTTPException, Query
from app.services.weather_service import weather_service
from app.schemas.weather import WeatherSummary

router = APIRouter()

@router.get("/forecast", response_model=WeatherSummary)
async def get_trip_weather(
    lat: float = Query(..., description="Destination Latitude"),
    lon: float = Query(..., description="Destination Longitude"),
    check_in_date: str = Query(..., description="Arrival Date YYYY-MM-DD"),
    check_out_date: str = Query(..., description="Departure Date YYYY-MM-DD")
):
    """
    Fetches the weather for the specific dates of the trip.
    If dates are > 30 days away, automatically extracts the City ID and uses Historical Data from exactly 1 year ago.
    """
    result = await weather_service.get_weather_for_trip(
        lat=lat, lon=lon, 
        check_in_date=check_in_date, check_out_date=check_out_date
    )
    
    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return result