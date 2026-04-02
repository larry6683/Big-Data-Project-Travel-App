from pydantic import BaseModel
from typing import List, Optional

class FlightSegment(BaseModel):
    departure_airport: str
    departure_airport_name: Optional[str] = None  # New field for the full departure name
    departure_time: str
    
    arrival_airport: str
    arrival_airport_name: Optional[str] = None    # New field for the full arrival name
    arrival_time: str
    
    carrier_code: str
    carrier_name: str
    flight_number: str
    checked_bags: Optional[int] = 0  

class FlightItinerary(BaseModel):
    duration: str
    stops: int
    segments: List[FlightSegment]

class FlightOffer(BaseModel):
    id: str
    price: float
    currency: str
    airline_code: str
    airline_name: str
    cabin_class: str
    itineraries: List[FlightItinerary]