
from fastapi import APIRouter
import httpx
from app.services.location_service import location_service

router = APIRouter()

@router.get("/search")
async def search_locations(keyword: str):
    """USA-only city search: 4 unique results, alphabetical, full state names."""
    if not keyword:
        return []

    results_to_merge = []

    # 1. Fetch from Nominatim
    nom_url = f"https://nominatim.openstreetmap.org/search?q={keyword}&format=json&addressdetails=1&countrycodes=us&limit=10"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(nom_url, headers={"User-Agent": "TravelPlannerApp"})
            for d in resp.json():
                addr = d.get("address", {})
                city = addr.get("city") or addr.get("town") or addr.get("village") or d.get("display_name").split(',')[0]
                state = addr.get("state") or ""
                if city:
                    results_to_merge.append({"city": city, "state": state})
        except Exception as e:
            print(f"Nominatim Error: {e}")

    # 2. Fetch from Amadeus
    try:
        amadeus_data = await location_service.search_locations(keyword)
        for item in amadeus_data:
            addr = item.get("address", {})
            city = addr.get("cityName")
            state = addr.get("stateName") or addr.get("stateCode")
            if city:
                results_to_merge.append({"city": city, "state": state})
    except Exception as e:
        print(f"Amadeus Error: {e}")

    # 3. Strict Deduplication
    # We use a set of lowercase (city, state) tuples to identify duplicates
    seen = set()
    unique_cities = []
    for item in results_to_merge:
        identifier = (item["city"].lower().strip(), item["state"].lower().strip())
        if identifier not in seen:
            seen.add(identifier)
            unique_cities.append(item)

    # # 4. Alphabetical Sort by City Name
    # unique_cities.sort(key=lambda x: x["city"].lower())

    # Return top 4 unique results
    return unique_cities[:4]

@router.get("/nearest")
async def get_nearest(lat: float, lon: float):
    """Detects nearest place for GPS using full state names."""
    url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json&addressdetails=1"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, headers={"User-Agent": "TravelPlannerApp"})
            addr = resp.json().get("address", {})
            city = addr.get("city") or addr.get("town") or addr.get("village")
            state = addr.get("state") or ""
            return {"city": city, "state": state, "type": "city"}
        except:
            return {"city": "Unknown", "state": "", "type": "city"}