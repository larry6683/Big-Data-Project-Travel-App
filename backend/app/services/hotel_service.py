import httpx
from app.services.base_client import BaseAmadeusClient
from app.schemas.hotel import Hotel, HotelOffer
from app.core.cache import get_cache, set_cache

class HotelService(BaseAmadeusClient):
    
    async def get_available_hotels_by_geocode(self, lat: float, lon: float, check_in_date: str, check_out_date: str, adults: int, radius: int = 50):
        """Fetches nearby hotels, checks availability in bulk, and only returns available ones."""
        cache_key = f"available_hotels:{round(lat, 2)}:{round(lon, 2)}:{check_in_date}:{check_out_date}:{adults}:{radius}"
        cached_data = get_cache(cache_key)
        if cached_data:
            return cached_data

        token = await self.get_token()
        if not token:
            return {"error": "Authentication Failed"}

        # --- PART 1: Get Reference Data (Hotels that physically exist) ---
        ref_url = f"{self.base_url}/v1/reference-data/locations/hotels/by-geocode"
        headers = {"Authorization": f"Bearer {token}"}
        ref_params = {"latitude": lat, "longitude": lon, "radius": radius, "radiusUnit": "KM"}

        async with httpx.AsyncClient() as client:
            try:
                print(f"🏨 Finding hotels near {lat}, {lon}")
                ref_response = await client.get(ref_url, headers=headers, params=ref_params, timeout=30.0)
                if ref_response.status_code != 200:
                    return {"error": ref_response.text}
                
                raw_hotels = ref_response.json().get("data", [])
                
                # Sort by distance and take the closest 50
                raw_hotels.sort(key=lambda x: x.get("distance", {}).get("value", 999))
                closest_50_hotels = raw_hotels[:50]
                
                if not closest_50_hotels:
                    return []

                # Extract IDs for the bulk check
                hotel_ids = [h.get("hotelId") for h in closest_50_hotels]
                hotel_ids_string = ",".join(hotel_ids)

                # NEW: Create a map of Hotel IDs to their Addresses from the Reference Data
                address_map = {h.get("hotelId"): h.get("address") for h in closest_50_hotels}

                # --- PART 2: Bulk Check Availability (Pre-Filtering) ---
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
                            
                            best_offer = item["offers"][0]
                            offer_obj = HotelOffer(
                                hotel_id=h_id,
                                name=item["hotel"].get("name"),
                                check_in_date=best_offer.get("checkInDate"),
                                check_out_date=best_offer.get("checkOutDate"),
                                guests=adults,
                                price=float(best_offer["price"]["total"]),
                                currency=best_offer["price"]["currency"],
                                latitude=item["hotel"].get("latitude"),
                                longitude=item["hotel"].get("longitude"),
                                address=address_map.get(h_id)  # NEW: Inject the address here!
                            )
                            set_cache(f"hotel_offer:{h_id}:{check_in_date}:{check_out_date}:{adults}", offer_obj.model_dump(), expire_seconds=1800)

                # --- PART 3: Filter and Return ---
                clean_available_hotels = []
                for hotel in closest_50_hotels:
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

                if clean_available_hotels:
                    set_cache(cache_key, [h.model_dump() for h in clean_available_hotels], expire_seconds=1800)
                
                return clean_available_hotels
            except Exception as e:
                return {"error": str(e)}

    async def get_specific_hotel_offer(self, hotel_id: str, check_in_date: str, check_out_date: str, adults: int):
        """Fetches the exact price. Since we pre-fetched in Step 1, this will almost always be an instant cache hit!"""
        cache_key = f"hotel_offer:{hotel_id}:{check_in_date}:{check_out_date}:{adults}"
        cached_data = get_cache(cache_key)
        
        if cached_data:
            print(f"⚡ INSTANT CACHE HIT for Hotel Checkbox Click: {hotel_id}")
            return cached_data
            
        return {"error": "Offer expired or not available. Please refresh the hotel list."}

hotel_service = HotelService()