# larry6683/big-data-project-travel-app/backend/app/api/v1/endpoints/locations.py

from fastapi import APIRouter
import httpx
from app.services.location_service import location_service

router = APIRouter()

US_STATES = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
    "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia",
    "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
    "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
    "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri",
    "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey",
    "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
    "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
    "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
    "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming"
}

def normalize_state(state_str: str) -> str:
    if not state_str:
        return ""
    s = state_str.strip()
    if len(s) == 2 and s.upper() in US_STATES:
        return US_STATES[s.upper()]
    return s

@router.get("/search")
async def search_locations(keyword: str):
    if not keyword:
        return []

    results_to_merge = []
    search_term_no_spaces = keyword.lower().strip().replace(" ", "")

    nom_url = f"https://nominatim.openstreetmap.org/search?q={keyword}&format=json&addressdetails=1&countrycodes=us&limit=10"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(nom_url, headers={"User-Agent": "TravelPlannerApp"})
            for d in resp.json():
                addr = d.get("address", {})
                city = addr.get("city") or addr.get("town") or addr.get("municipality")
                state = addr.get("state") or ""
                
                if city:
                    city_no_spaces = city.lower().replace(" ", "")
                    if search_term_no_spaces in city_no_spaces:
                        results_to_merge.append({
                            "city": city.title(), 
                            "state": normalize_state(state)
                        })
        except Exception as e:
            print(f"Nominatim Error: {e}")

    try:
        amadeus_data = await location_service.search_locations(keyword)
        for item in amadeus_data:
            city = item.get("name")
            addr = item.get("address", {})
            state_code = addr.get("stateCode") or ""
            
            if state_code.startswith("US-"):
                state_code = state_code.split("-")[1]
            
            if city:
                city_no_spaces = city.lower().replace(" ", "")
                if search_term_no_spaces in city_no_spaces:
                    results_to_merge.append({
                        "city": city.title(), 
                        "state": normalize_state(state_code)
                    })
    except Exception as e:
        print(f"Amadeus Error: {e}")

    seen = set()
    unique_cities = []
    for item in results_to_merge:
        state_val = item["state"].lower().strip() if item["state"] else ""
        identifier = (item["city"].lower().strip(), state_val)
        
        if identifier not in seen:
            seen.add(identifier)
            unique_cities.append(item)

    return unique_cities[:4]

@router.get("/nearest")
async def get_nearest(lat: float, lon: float):
    url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json&addressdetails=1"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, headers={"User-Agent": "TravelPlannerApp"})
            addr = resp.json().get("address", {})
            city = addr.get("city") or addr.get("town") or addr.get("municipality") or addr.get("village")
            state = addr.get("state") or ""
            
            return {
                "city": city, 
                "state": normalize_state(state), 
                "type": "city"
            }
        except:
            return {"city": "Unknown", "state": "", "type": "city"}

@router.get("/airport/nearest")
async def get_nearest_airport(lat: float, lon: float):
    """Detects nearest commercial airport IATA code using Amadeus."""
    iata = await location_service.get_nearest_airport(lat, lon)
    if iata:
        return {"iata": iata}
    return {"iata": None}