import httpx
from app.services.base_client import BaseAmadeusClient
from app.schemas.hotel import Hotel, HotelOffer
from app.services.location_service import location_service # <-- NEW: imported for the fallback

class HotelService(BaseAmadeusClient):
    
    async def get_available_hotels_by_geocode(self, lat: float, lon: float, check_in_date: str, check_out_date: str, adults: int, radius: int = 50):
        """Fetches nearby hotels, checks availability in bulk, and returns available ones directly."""
        print(f"🔍 [HOTELS] CACHE MISS: Fetching available hotels near {lat}, {lon}")
        token = await self.get_token()
        if not token:
            return {"error": "Authentication Failed"}

        # 1. FIX: Secure bounds and precision to prevent Amadeus 400 Bad Requests
        lat = round(lat, 5)
        lon = round(lon, 5)
        radius = min(max(int(radius), 1), 300)
        adults = max(1, min(int(adults), 9))

        ref_url = f"{self.base_url}/v1/reference-data/locations/hotels/by-geocode"
        headers = {"Authorization": f"Bearer {token}"}
        ref_params = {"latitude": lat, "longitude": lon, "radius": radius, "radiusUnit": "KM"}

        async with httpx.AsyncClient() as client:
            try:
                print(f"🏨 Finding hotels near {lat}, {lon}")
                ref_response = await client.get(ref_url, headers=headers, params=ref_params, timeout=30.0)
                
                # 2. FIX: FALLBACK! Amadeus is decommissioning 'by-geocode' for many API tiers.
                # If it fails, grab the nearest airport IATA and use the 'by-city' endpoint instead.
                if ref_response.status_code != 200:
                    print(f"⚠️ by-geocode failed ({ref_response.status_code}). Trying by-city fallback...")
                    iata = await location_service.get_nearest_airport(lat, lon)
                    if iata:
                        city_url = f"{self.base_url}/v1/reference-data/locations/hotels/by-city"
                        city_params = {"cityCode": iata}
                        ref_response = await client.get(city_url, headers=headers, params=city_params, timeout=30.0)

                if ref_response.status_code != 200:
                    return {"error": f"Amadeus API Error: {ref_response.text}"}
                
                raw_hotels = ref_response.json().get("data", [])
                
                raw_hotels.sort(key=lambda x: x.get("distance", {}).get("value", 999))
                
                # 3. FIX: Safely limit to 40 hotels to avoid URL-too-long limits in v3 bulk search
                closest_hotels = raw_hotels[:40]
                
                if not closest_hotels:
                    return []

                hotel_ids = [h.get("hotelId") for h in closest_hotels]
                hotel_ids_string = ",".join(hotel_ids)

                offer_url = f"{self.base_url}/v3/shopping/hotel-offers"
                offer_params = {
                    "hotelIds": hotel_ids_string,
                    "checkInDate": check_in_date,
                    "checkOutDate": check_out_date,
                    "adults": adults,
                    "currency": "USD"
                }

                print(f"🔄 Bulk checking availability for {len(hotel_ids)} hotels...")
                offer_response = await client.get(offer_url, headers=headers, params=offer_params, timeout=30.0)
                
                available_hotel_ids = set()
                
                if offer_response.status_code == 200:
                    offers_data = offer_response.json().get("data", [])
                    for item in offers_data:
                        if "offers" in item and item["offers"]:
                            h_id = item["hotel"]["hotelId"]
                            available_hotel_ids.add(h_id)

                clean_available_hotels = []
                for hotel in closest_hotels:
                    if hotel.get("hotelId") in available_hotel_ids:
                        clean_available_hotels.append(Hotel(
                            chain_code=hotel.get("chainCode"),
                            iata_code=hotel.get("iataCode"),
                            hotel_id=hotel.get("hotelId"),
                            name=hotel.get("name"),
                            geo_code=hotel.get("geoCode"),
                            rating=hotel.get("rating"),
                            distance_km=hotel.get("distance", {}).get("value"),
                            address=hotel.get("address")
                        ))

                return clean_available_hotels
            except Exception as e:
                return {"error": str(e)}

    async def get_specific_hotel_offer(self, hotel_id: str, check_in_date: str, check_out_date: str, adults: int):
        """Actively fetches the exact price for a specific hotel."""
        print(f"🔍 [HOTEL OFFER] CACHE MISS: Fetching price for Hotel ID: {hotel_id}")
        token = await self.get_token()
        if not token:
            return {"error": "Authentication Failed"}

        adults = max(1, min(int(adults), 9))

        offer_url = f"{self.base_url}/v3/shopping/hotel-offers"
        offer_params = {
            "hotelIds": hotel_id,
            "checkInDate": check_in_date,
            "checkOutDate": check_out_date,
            "adults": adults,
            "currency": "USD"
        }
        headers = {"Authorization": f"Bearer {token}"}

        async with httpx.AsyncClient() as client:
            try:
                print(f"🔄 Fetching specific offer for hotel {hotel_id}...")
                offer_response = await client.get(offer_url, headers=headers, params=offer_params, timeout=30.0)
# Inside hotel_service.py -> get_specific_hotel_offer Success Block

                if offer_response.status_code == 200:
                    offers_data = offer_response.json().get("data", [])
                    if offers_data and "offers" in offers_data[0]:
                        item = offers_data[0]
                        rooms = []
                        
                        for o in item["offers"]:
                            room_data = o.get("room", {})
                            type_est = room_data.get("typeEstimated", {})
                            
                            rooms.append({
                                "room_name": type_est.get("category", "Standard Room").replace("_", " "),
                                "description": room_data.get("description", {}).get("text", ""),
                                "category": type_est.get("category", "Room").replace("_", " "),
                                "bed_type": type_est.get("bedType", "Standard").replace("_", " "),
                                "beds_count": type_est.get("beds", 1),
                                "price": float(o["price"]["total"]),
                                "currency": o["price"]["currency"],
                                "amenities": o.get("amenities", [])
                            })

                        best_offer = item["offers"][0]
                        return HotelOffer(
                            hotel_id=hotel_id,
                            name=item["hotel"].get("name"),
                            check_in_date=best_offer.get("checkInDate"),
                            check_out_date=best_offer.get("checkOutDate"),
                            guests=adults,
                            price=float(best_offer["price"]["total"]),
                            currency=best_offer["price"]["currency"],
                            latitude=item["hotel"].get("latitude"),
                            longitude=item["hotel"].get("longitude"),
                            rooms=rooms
                        ).model_dump()
            except Exception as e:
                return {"error": str(e)}

        return {"error": "Offer expired or not available. Please refresh the hotel list."}

hotel_service = HotelService()