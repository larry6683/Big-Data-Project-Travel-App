# larry6683/big-data-project-travel-app/backend/app/services/location_service.py

import httpx
from app.services.base_client import BaseAmadeusClient

class LocationService(BaseAmadeusClient):
    async def search_locations(self, keyword: str):
        token = await self.get_token()
        if not token:
            return []

        # Updated to the specific City Search endpoint
        url = f"{self.base_url}/v1/reference-data/locations/cities"
        headers = {"Authorization": f"Bearer {token}"}
        params = {
            "keyword": keyword,
            "countryCode": "US",
            "max": 10
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=headers, params=params)
                if response.status_code != 200:
                    return []
                return response.json().get("data", [])
            except Exception:
                return []

    async def get_nearest_airport(self, lat: float, lon: float):
        """Fetches the nearest commercial airport to a given lat/lon using Amadeus."""
        token = await self.get_token()
        if not token:
            return None

        url = f"{self.base_url}/v1/reference-data/locations/airports"
        headers = {"Authorization": f"Bearer {token}"}
        params = {
            "latitude": lat,
            "longitude": lon,
            "radius": 500, # Search up to 500km radius
            "page[limit]": 1 # We only need the top result
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=headers, params=params)
                if response.status_code == 200:
                    data = response.json().get("data", [])
                    if data:
                        return data[0].get("iataCode")
            except Exception as e:
                print(f"Error fetching nearest airport: {e}")
        return None

location_service = LocationService()