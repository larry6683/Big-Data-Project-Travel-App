import httpx
from app.services.base_client import BaseAmadeusClient
from app.core.cache import get_cache, set_cache

class LocationService(BaseAmadeusClient):
    
    async def get_airports_by_location(self, lat: float, lon: float, radius: int = 100):
        cache_key = f"nearby_airports:{round(lat, 2)}:{round(lon, 2)}:{radius}"
        cached_data = get_cache(cache_key)
        if cached_data:
            return cached_data

        token = await self.get_token()
        if not token:
            return {"error": "Authentication Failed"}

        url = f"{self.base_url}/v1/reference-data/locations/airports"
        headers = {"Authorization": f"Bearer {token}"}
        params = {
            "latitude": lat,
            "longitude": lon,
            "radius": radius
        }

        print(f"🌍 Finding airports near Lat:{lat}, Lon:{lon}")
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=headers, params=params)
                if response.status_code != 200:
                    return []
                
                data = response.json().get("data", [])
                clean_airports = []
                for loc in data:
                    clean_airports.append({
                        "name": loc.get("name"),
                        "iata_code": loc.get("iataCode"),
                        "distance_km": loc.get("distance", {}).get("value")
                    })
                
                if clean_airports:
                    set_cache(cache_key, clean_airports, expire_seconds=86400)

                return clean_airports
            except Exception as e:
                print(f"Error fetching nearby airports: {e}")
                return []

    async def search_locations(self, keyword: str):
        cache_key = f"location_search:{keyword.lower()}"
        cached_data = get_cache(cache_key)
        if cached_data:
            return cached_data

        token = await self.get_token()
        if not token:
            return {"error": "Authentication Failed"}

        url = f"{self.base_url}/v1/reference-data/locations"
        headers = {"Authorization": f"Bearer {token}"}
        params = {
            "subType": "CITY,AIRPORT",
            "keyword": keyword,
            "countryCode": "US",
            "page[limit]": 20,
            "view": "FULL",
            "sort": "analytics.travelers.score"
        }

        print(f"🌍 Calling Amadeus API for Locations: {keyword}")
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=headers, params=params)
                if response.status_code != 200:
                    return []
                
                data = response.json().get("data", [])
                clean_locations = []
                for loc in data:
                    if "iataCode" in loc:
                        clean_locations.append({
                            "id": loc.get("id"),
                            "name": loc.get("name"),
                            "detailed_name": loc.get("detailedName"),
                            "iata_code": loc.get("iataCode"),
                            "geo_code": loc.get("geoCode"), 
                            "address": loc.get("address")   
                        })

                if clean_locations:
                    set_cache(cache_key, clean_locations, expire_seconds=2592000)

                return clean_locations
            except Exception as e:
                print(f"Error fetching locations: {e}")
                return []

location_service = LocationService()