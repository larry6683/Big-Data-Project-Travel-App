import requests
import json
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from backend.app.api.v1.endpoints.locations import * 
from backend.app.api.v1.endpoints.flights import * 
from pydantic import BaseModel
from typing import List

class FlightSegment(BaseModel):
    departure_airport: str
    departure_time: str
    arrival_airport: str
    arrival_time: str
    carrier_code: str
    carrier_name: str
    flight_number: str

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



class Testapiendpoints():
    
    get_airport_endpoint_param = ("lat, long, expected_output", 
                            [
                                #DENVER Positive test
                                pytest.param(39.7392, -104.9903, [{'name': 'DENVER INTERNATIONAL', 'iata_code': 'DEN', 'distance_km': 30}, {'name': 'NORTHERN COLORADO REGIONAL', 'iata_code': 'FNL', 'distance_km': 79}]),
                                #Invalid Test
                                pytest.param(0.0, 0.0, []),
                            ])
    

    #Example Flight Offer: #FlightOffer(id='1', price=804.88, currency='USD', airline_code='AS', airline_name='ALASKA AIRLINES', cabin_class='ECONOMY', itineraries=[FlightItinerary(duration='10H11M', stops=1, segments=[FlightSegment(departure_airport='DEN', departure_time='2026-05-24T19:04:00', arrival_airport='SAN', arrival_time='2026-05-24T20:27:00', carrier_code='AS', carrier_name='ALASKA AIRLINES', flight_number='1428'), FlightSegment(departure_airport='SAN', departure_time='2026-05-24T22:45:00', arrival_airport='JFK', arrival_time='2026-05-25T07:15:00', carrier_code='AS', carrier_name='ALASKA AIRLINES', flight_number='36')]), FlightItinerary(duration='9H21M', stops=1, segments=[FlightSegment(departure_airport='JFK', departure_time='2026-05-25T16:30:00', arrival_airport='SAN', arrival_time='2026-05-25T19:28:00', carrier_code='AS', carrier_name='ALASKA AIRLINES', flight_number='25'), FlightSegment(departure_airport='SAN', departure_time='2026-05-25T20:29:00', arrival_airport='DEN', arrival_time='2026-05-25T23:51:00', carrier_code='AS', carrier_name='ALASKA AIRLINES', flight_number='3021')])])
    search_flight_endpoint_param = ("origin, destination, date, return_date, adults, travel_class, children, expected_output", 
                            [
                                #DENVER Positive test
                                pytest.param("DEN", "JFK", "2026-05-24", "2026-05-25", 2, "ECONOMY", 0, FlightOffer),
                                # #Invalid Test
                                pytest.param("DEN", "DEN", "2026-05-25", "2026-05-25", 2, "ECONOMY", 0, False),
                                # # Input Validation
                                pytest.param(56, "DEN", "2026-05-25", "2026-05-25", 2, "ECONOMY", 0, False),
                                
                            ])
    
    @pytest.mark.parametrize(*get_airport_endpoint_param)
    @pytest.mark.anyio
    async def test_get_nearby_airports(self, lat, long, expected_output):
        """ Hitting actual endpoint. Need Api Keys and internet connection for this test. """
        airport = await get_nearby_airports(lat, long)
        assert airport == expected_output
        
        
    @pytest.mark.parametrize(*search_flight_endpoint_param)
    @pytest.mark.anyio
    async def test_search_flights(self, origin, destination, date, return_date, adults, travel_class, children, expected_output):
        try:
            flights = await search_flights(origin, destination, date, return_date, adults, travel_class, children)
        except Exception as e:    
            if expected_output == False:
                return
            
        try:
            flight_obj = expected_output(**flights[0])
        except Exception as e:
            pytest.fail(f"Flight object creation error {e}")
        assert True
        
        
    # mock = AsyncMock()
    
    # @pytest.mark.parametrize(*search_flight_endpoint_param)
    # @pytest.mark.anyio
    # async def test_search_flights_with_mock(self, origin, destination, date, return_date, adults, travel_class, children, expected_output):
    #     self.mock.return_value = expected_output
    #     with patch("backend.app.api.v1.endpoints.flights.flight_service.search_flights") as mock_api:
    #         flights = await search_flights(origin, destination, date, return_date, adults, travel_class, children)
    #         print(flights[0])
    #         assert isinstance(flights[0], expected_output)
    
    # @pytest.mark.parametrize(*get_airport_endpoint_param)
    # @pytest.mark.anyio
    # async def test_get_nearby_airports_mock(self, lat, long, expected_output):
    #     """
    #         Testing with no api access. Testing general functionality of function
    #     """
    #    
    #     mock.return_value = expected_output
    #     with patch("backend.app.api.v1.endpoints.locations.location_service.get_airports_by_location", mock) as api_mock:
    #         airport = await get_nearby_airports(lat, long)
    #         assert airport == expected_output
    
