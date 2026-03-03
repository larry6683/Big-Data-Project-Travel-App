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
    """Converts 2-letter state codes into full state names to prevent duplicates."""
    if not state_str:
        return ""
    s = state_str.strip()
    if len(s) == 2 and s.upper() in US_STATES:
        return US_STATES[s.upper()]
    return s

@router.get("/search")
async def search_locations(keyword: str):
    """USA-only city search: unique results, full state names, space-agnostic strict matching."""
    if not keyword:
        return []

    results_to_merge = []
    
    # Create a version of the search term with no spaces for flexible matching
    search_term_no_spaces = keyword.lower().strip().replace(" ", "")

    # 1. Fetch from Nominatim (Accepting cities, towns, and municipalities)
    nom_url = f"https://nominatim.openstreetmap.org/search?q={keyword}&format=json&addressdetails=1&countrycodes=us&limit=10"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(nom_url, headers={"User-Agent": "TravelPlannerApp"})
            for d in resp.json():
                addr = d.get("address", {})
                
                # Expanded to include towns and municipalities
                city = addr.get("city") or addr.get("town") or addr.get("municipality")
                state = addr.get("state") or ""
                
                # Space-agnostic strict filter
                if city:
                    city_no_spaces = city.lower().replace(" ", "")
                    if search_term_no_spaces in city_no_spaces:
                        results_to_merge.append({
                            "city": city.title(), 
                            "state": normalize_state(state)
                        })
        except Exception as e:
            print(f"Nominatim Error: {e}")

    # 2. Fetch from Amadeus
    try:
        amadeus_data = await location_service.search_locations(keyword)
        for item in amadeus_data:
            # In the City Search endpoint, the city name is mapped to 'name'
            city = item.get("name")
            addr = item.get("address", {})
            state_code = addr.get("stateCode") or ""
            
            # The City Search API often formats states as "US-CO" instead of "CO"
            if state_code.startswith("US-"):
                state_code = state_code.split("-")[1]
            
            # Space-agnostic strict filter
            if city:
                city_no_spaces = city.lower().replace(" ", "")
                if search_term_no_spaces in city_no_spaces:
                    results_to_merge.append({
                        "city": city.title(), 
                        "state": normalize_state(state_code)
                    })
    except Exception as e:
        print(f"Amadeus Error: {e}")

    # 3. Strict Deduplication by City Name
    seen = set()
    unique_cities = []
    for item in results_to_merge:
        state_val = item["state"].lower().strip() if item["state"] else ""
        identifier = (item["city"].lower().strip(), state_val)
        
        if identifier not in seen:
            seen.add(identifier)
            unique_cities.append(item)

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
            city = addr.get("city") or addr.get("town") or addr.get("municipality") or addr.get("village")
            state = addr.get("state") or ""
            
            return {
                "city": city, 
                "state": normalize_state(state), 
                "type": "city"
            }
        except:
            return {"city": "Unknown", "state": "", "type": "city"}