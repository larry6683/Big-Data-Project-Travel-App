# larry6683/big-data-project-travel-app/backend/app/services/location_service.py

import httpx
from app.services.base_client import BaseAmadeusClient

class LocationService(BaseAmadeusClient):
    async def search_locations(self, keyword: str):
        token = await self.get_token()
        if not token:
            return []

        url = f"{self.base_url}/v1/reference-data/locations"
        headers = {"Authorization": f"Bearer {token}"}
        params = {
            "subType": "CITY", # Strictly cities
            "keyword": keyword,
            "countryCode": "US",
            "page[limit]": 10
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=headers, params=params)
                if response.status_code != 200:
                    return []
                return response.json().get("data", [])
            except Exception:
                return []

location_service = LocationService()