import httpx
import asyncio
import airportsdata
from app.services.base_client import BaseAmadeusClient
from app.schemas.flight import FlightOffer, FlightSegment, FlightItinerary

class FlightService(BaseAmadeusClient):
    
    def __init__(self):
        super().__init__()
        # Load the 28,000+ airport database into memory instantly when the service starts
        # Using 'IATA' makes the 3-letter code the dictionary key
        self.airports_dict = airportsdata.load('IATA')

    def get_airport_name(self, iata_code: str) -> str:
        """Instantly resolves the IATA code from the local database in O(1) time."""
        if not iata_code or iata_code == "TBA":
            return "Airport"
            
        code_upper = iata_code.upper()
        
        # Look up the code in the local dictionary
        airport_info = self.airports_dict.get(code_upper)
        
        if airport_info:
            return airport_info.get("name", code_upper)
            
        return code_upper

    def _parse_flight_data(self, raw_data: dict) -> list[FlightOffer]:
        clean_results = []
        if "data" not in raw_data:
            return []

        carriers_dict = raw_data.get("dictionaries", {}).get("carriers", {})

        for offer in raw_data["data"]:
            try:
                price = float(offer.get("price", {}).get("grandTotal", 0.0))
                currency = offer.get("price", {}).get("currency", "USD")
                
                val_codes = offer.get("validatingAirlineCodes", [])
                main_carrier_code = val_codes[0] if val_codes else "UNKNOWN"
                main_carrier_name = carriers_dict.get(main_carrier_code, main_carrier_code)

                cabin_class = "ECONOMY"
                traveler_pricings = offer.get("travelerPricings", [])
                
                bags_by_seg = {}
                if traveler_pricings:
                    fare_details = traveler_pricings[0].get("fareDetailsBySegment", [])
                    if fare_details:
                        cabin_class = fare_details[0].get("cabin", "ECONOMY")
                        for fd in fare_details:
                            seg_id = fd.get("segmentId")
                            
                            checked = 0
                            cabin = 0
                            personal = 1
                            
                            if "includedCheckedBags" in fd:
                                bags_info = fd["includedCheckedBags"]
                                if "quantity" in bags_info:
                                    checked = bags_info["quantity"]
                                elif "weight" in bags_info:
                                    checked = 1 
                                    
                            amenities = fd.get("amenities", [])
                            for am in amenities:
                                desc = am.get("description", "").upper()
                                if "CARRY" in desc or "CABIN" in desc:
                                    cabin = 1
                                if "CHECKED" in desc and checked == 0:
                                    checked = 1
                            
                            bags_by_seg[seg_id] = {
                                "personal": personal,
                                "cabin": cabin,
                                "checked": checked
                            }

                clean_itineraries = []
                for itinerary in offer.get("itineraries", []):
                    itin_duration = itinerary.get("duration", "").replace("PT", "")
                    clean_segments = []
                    
                    for seg in itinerary.get("segments", []):
                        seg_carrier_code = seg.get("carrierCode", "UNKNOWN")
                        seg_carrier_name = carriers_dict.get(seg_carrier_code, seg_carrier_code)
                        
                        departure = seg.get("departure", {})
                        arrival = seg.get("arrival", {})
                        
                        bag_data = bags_by_seg.get(seg.get("id"), {"personal": 1, "cabin": 0, "checked": 0})
                        
                        clean_segments.append(FlightSegment(
                            departure_airport=departure.get("iataCode", "TBA"),
                            departure_airport_name=None, 
                            departure_time=departure.get("at", "TBA"),
                            arrival_airport=arrival.get("iataCode", "TBA"),
                            arrival_airport_name=None, 
                            arrival_time=arrival.get("at", "TBA"),
                            carrier_code=seg_carrier_code,
                            carrier_name=seg_carrier_name,  
                            flight_number=seg.get("number", "TBA"),
                            personal_item=bag_data["personal"],
                            cabin_bags=bag_data["cabin"],
                            checked_bags=bag_data["checked"]
                        ))
                    
                    clean_itineraries.append(FlightItinerary(
                        duration=itin_duration,
                        stops=max(0, len(clean_segments) - 1),
                        segments=clean_segments
                    ))

                flight_obj = FlightOffer(
                    id=offer.get("id", "0"),
                    price=price,
                    currency=currency,
                    airline_code=main_carrier_code,
                    airline_name=main_carrier_name,    
                    cabin_class=cabin_class,        
                    itineraries=clean_itineraries 
                )
                clean_results.append(flight_obj)

            except Exception as e:
                continue
        
        return clean_results

    async def search_flights(self, origin: str, destination: str, date: str, return_date: str, adults: int, travel_class: str = "ECONOMY", children: int = 0):
        print(f"🔍 CACHE MISS: Fetching real-time flight data for {origin} -> {destination}")
        token = await self.get_token()
        if not token:
            return {"error": "Authentication Failed"}

        classes_to_search = [c.strip().upper() for c in travel_class.split(",")]
        
        async def fetch_for_class(t_class):
            url = f"{self.base_url}/v2/shopping/flight-offers"
            headers = {"Authorization": f"Bearer {token}"}
            params = {
                "originLocationCode": origin,
                "destinationLocationCode": destination,
                "departureDate": date,
                "returnDate": return_date, 
                "adults": adults,
                "travelClass": t_class,
                "max": 50,  
                "currencyCode": "USD"
            }
            if children > 0:
                params["children"] = children

            async with httpx.AsyncClient() as client:
                try:
                    response = await client.get(url, headers=headers, params=params, timeout=30.0)
                    if response.status_code == 200:
                        return self._parse_flight_data(response.json())
                    return []
                except Exception as e:
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
        
        # --- INSTANT NAME RESOLUTION --- 
        unique_iata_codes = set()
        for flight in clean_data:
            for itin in flight.itineraries:
                for seg in itin.segments:
                    if seg.departure_airport and seg.departure_airport != "TBA":
                        unique_iata_codes.add(seg.departure_airport)
                    if seg.arrival_airport and seg.arrival_airport != "TBA":
                        unique_iata_codes.add(seg.arrival_airport)

        # Because we are using a local dictionary, we don't need async/await here anymore!
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