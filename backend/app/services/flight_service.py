import os
from app.core.config import settings
import httpx
import asyncio
import airportsdata
from app.services.base_client import BaseAmadeusClient
from app.schemas.flight import FlightOffer, FlightSegment, FlightItinerary

# Put your Duffel token here, or better, add DUFFEL_API_KEY to your .env file
DUFFEL_API_KEY = settings.DUFFEL_API_KEY

class FlightService(BaseAmadeusClient):
    
    def __init__(self):
        super().__init__()
        # Load the 28,000+ airport database into memory instantly when the service starts
        self.airports_dict = airportsdata.load('IATA')

    def get_airport_name(self, iata_code: str) -> str:
        """Instantly resolves the IATA code from the local database in O(1) time."""
        if not iata_code or iata_code == "TBA":
            return "Airport"
            
        code_upper = iata_code.upper()
        airport_info = self.airports_dict.get(code_upper)
        
        if airport_info:
            return airport_info.get("name", code_upper)
            
        return code_upper

    def _parse_flight_data(self, raw_data: dict) -> list[FlightOffer]:
        """Parses Duffel's specific JSON structure into our custom Pydantic schemas"""
        clean_results = []
        offers = raw_data.get("data", {}).get("offers", [])[:50]
        
        if not offers:
            return []

        for offer in offers:
            try:
                # 1. Extract Price and Airline
                price = float(offer.get("total_amount", 0.0))
                currency = offer.get("total_currency", "USD")
                
                owner = offer.get("owner", {})
                main_carrier_code = owner.get("iata_code", "UNKNOWN")
                main_carrier_name = owner.get("name", main_carrier_code)

                clean_itineraries = []
                overall_cabin_class = "ECONOMY"
                
                # 2. Extract Slices (Itineraries like Outbound / Inbound)
                for slice_data in offer.get("slices", []):
                    itin_duration = slice_data.get("duration", "").replace("PT", "")
                    clean_segments = []
                    
                    # 3. Extract Segments for each Slice
                    segments = slice_data.get("segments", [])
                    for seg in segments:
                        op_carrier = seg.get("operating_carrier", {})
                        if not op_carrier:
                            op_carrier = seg.get("marketing_carrier", {})
                            
                        seg_carrier_code = op_carrier.get("iata_code", "UNKNOWN")
                        seg_carrier_name = op_carrier.get("name", seg_carrier_code)
                        
                        departure = seg.get("origin", {})
                        arrival = seg.get("destination", {})
                        
                        # 4. Extract Baggage Allowance and Cabin Class
                        personal = 1
                        cabin = 0
                        checked = 0
                        
                        passengers = seg.get("passengers", [])
                        if passengers:
                            p = passengers[0]
                            overall_cabin_class = p.get("cabin_class", "economy").upper()
                            bags = p.get("baggages", [])
                            for bag in bags:
                                b_type = bag.get("type")
                                qty = bag.get("quantity", 1)
                                if b_type == "carry_on":
                                    cabin += qty
                                elif b_type == "checked":
                                    checked += qty

                        clean_segments.append(FlightSegment(
                            departure_airport=departure.get("iata_code", "TBA"),
                            departure_airport_name=None, 
                            departure_time=seg.get("departing_at", "TBA"),
                            arrival_airport=arrival.get("iata_code", "TBA"),
                            arrival_airport_name=None, 
                            arrival_time=seg.get("arriving_at", "TBA"),
                            carrier_code=seg_carrier_code,
                            carrier_name=seg_carrier_name,  
                            flight_number=seg.get("operating_carrier_flight_number", "TBA"),
                            personal_item=personal,
                            cabin_bags=cabin,
                            checked_bags=checked
                        ))
                    
                    clean_itineraries.append(FlightItinerary(
                        duration=itin_duration,
                        stops=max(0, len(clean_segments) - 1),
                        segments=clean_segments
                    ))

                # 5. Build final Object
                flight_obj = FlightOffer(
                    id=offer.get("id", "0"),
                    price=price,
                    currency=currency,
                    airline_code=main_carrier_code,
                    airline_name=main_carrier_name,    
                    cabin_class=overall_cabin_class,        
                    itineraries=clean_itineraries 
                )
                clean_results.append(flight_obj)

            except Exception as e:
                print(f"Error parsing an individual Duffel offer: {e}")
                continue
        
        return clean_results

    async def search_flights(self, origin: str, destination: str, date: str, return_date: str, adults: int, travel_class: str = "ECONOMY", children: int = 0):
        print(f"🔍 [DUFFEL] CACHE MISS: Fetching real-time flight data for {origin} -> {destination}")
        
        # Amadeus uses "ECONOMY", Duffel needs "economy"
        classes_to_search = [c.strip().lower() for c in travel_class.split(",")]
        
        async def fetch_for_class(t_class):
            url = "https://api.duffel.com/air/offer_requests"
            # Change this inside the fetch_for_class function
            headers = {
    "Duffel-Version": "v2",  # Updated from "v1" to "v2"
    "Authorization": f"Bearer {DUFFEL_API_KEY}",
    "Content-Type": "application/json"
               }
            
            # Form slices (One Way vs Round Trip)
            slices = [{"origin": origin, "destination": destination, "departure_date": date}]
            if return_date and return_date.strip():
                slices.append({"origin": destination, "destination": origin, "departure_date": return_date})
                
            # Form passengers array
            passengers = [{"type": "adult"} for _ in range(adults)]
            if children > 0:
                passengers.extend([{"type": "child"} for _ in range(children)])
                
            payload = {
                "data": {
                    "slices": slices,
                    "passengers": passengers,
                    "cabin_class": t_class
                }
            }

            async with httpx.AsyncClient() as client:
                try:
                    response = await client.post(url, headers=headers, json=payload, timeout=30.0)
                    if response.status_code in (200, 201):
                        return self._parse_flight_data(response.json())
                    else:
                        print(f"❌ Duffel API Error ({response.status_code}): {response.text}")
                        return []
                except Exception as e:
                    print(f"❌ Connection Error: {e}")
                    return []

        tasks = [fetch_for_class(c) for c in classes_to_search]
        results = await asyncio.gather(*tasks)

        clean_data = []
        seen_signatures = set()

        for res in results:
            if isinstance(res, list):
                for flight in res:
                    try:
                        first_flight_num = flight.itineraries[0].segments[0].flight_number
                        signature = f"{flight.price}_{flight.airline_code}_{first_flight_num}_{flight.cabin_class}"
                    except (IndexError, AttributeError):
                        signature = flight.id
                    
                    if signature not in seen_signatures:
                        seen_signatures.add(signature)
                        flight.id = f"flight_{len(seen_signatures)}"
                        clean_data.append(flight)
        
        # --- INSTANT NAME RESOLUTION (Still works perfectly with Duffel!) --- 
        unique_iata_codes = set()
        for flight in clean_data:
            for itin in flight.itineraries:
                for seg in itin.segments:
                    if seg.departure_airport and seg.departure_airport != "TBA":
                        unique_iata_codes.add(seg.departure_airport)
                    if seg.arrival_airport and seg.arrival_airport != "TBA":
                        unique_iata_codes.add(seg.arrival_airport)

        resolved_names = {code: self.get_airport_name(code) for code in unique_iata_codes}

        for flight in clean_data:
            for itin in flight.itineraries:
                for seg in itin.segments:
                    if seg.departure_airport in resolved_names:
                        seg.departure_airport_name = resolved_names[seg.departure_airport]
                    if seg.arrival_airport in resolved_names:
                        seg.arrival_airport_name = resolved_names[seg.arrival_airport]

        return clean_data

flight_service = FlightService()