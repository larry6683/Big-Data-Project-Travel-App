from fastapi import APIRouter
import httpx
import random
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
    if not state_str: return ""
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

    # 1. Use Open-Meteo instead of Nominatim for Autocomplete (Fast, no strict blocks)
    open_meteo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={keyword}&count=10&format=json"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(open_meteo_url, timeout=5.0)
            if resp.status_code == 200:
                data = resp.json().get("results", [])
                for d in data:
                    city = d.get("name")
                    state = d.get("admin1") or ""
                    country = d.get("country_code")
                    
                    if city and country == "US":
                        city_no_spaces = city.lower().replace(" ", "")
                        if search_term_no_spaces in city_no_spaces:
                            results_to_merge.append({
                                "city": city.title(), 
                                "state": normalize_state(state)
                            })
        except Exception as e:
            print(f"Open-Meteo Search Error: {e}")

    # 2. Amadeus Fallback
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

# backend/app/api/v1/endpoints/locations.py

@router.get("/nearest")
async def get_nearest(lat: float, lon: float):
    """Detects the nearest city using multiple geocoding providers for redundancy."""
    
    # Provider 1: BigDataCloud (Fastest, no key required)
    bdc_url = f"https://api.bigdatacloud.net/data/reverse-geocode-client?latitude={lat}&longitude={lon}&localityLanguage=en"
    
    async with httpx.AsyncClient() as client:
        try:
            print(f"🌍 GPS: Attempting BigDataCloud for {lat}, {lon}")
            resp = await client.get(bdc_url, timeout=5.0)
            if resp.status_code == 200:
                data = resp.json()
                city = data.get("city") or data.get("locality") or data.get("principalSubdivision")
                state = data.get("principalSubdivision") or ""
                if city and city.lower() != "unknown":
                    return {"city": city, "state": normalize_state(state), "type": "city"}
            print(f"⚠️ GPS: BigDataCloud failed (Status {resp.status_code})")
        except Exception as e:
            print(f"❌ GPS: BigDataCloud Exception: {e}")

        # Provider 2: Nominatim (Fallback)
        nom_url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json"
        # Randomized User-Agent helps bypass common blocks
        headers = {"User-Agent": f"WanderPlan_Bot_{random.randint(1000, 9999)}"}
        
        try:
            print(f"🌍 GPS: Falling back to Nominatim for {lat}, {lon}")
            resp = await client.get(nom_url, headers=headers, timeout=5.0)
            if resp.status_code == 200:
                addr = resp.json().get("address", {})
                city = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("hamlet")
                state = addr.get("state") or ""
                if city:
                    return {"city": city, "state": normalize_state(state), "type": "city"}
            print(f"⚠️ GPS: Nominatim failed (Status {resp.status_code})")
        except Exception as e:
            print(f"❌ GPS: Nominatim Exception: {e}")

    # Final Fallback: Return empty so the frontend knows it failed
    return {"city": None, "state": None, "type": "city"}

@router.get("/geocode")
async def geocode_location(keyword: str):
    """Safely converts a city name to coordinates using Open-Meteo"""
    if not keyword:
        return {"error": "No keyword provided"}
        
    # Extract just the city name if format is "City, State" so the API doesn't get confused
    city_name = keyword.split(",")[0].strip()
        
    url = f"https://geocoding-api.open-meteo.com/v1/search?name={city_name}&count=1&format=json"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, timeout=10.0)
            if resp.status_code == 200:
                data = resp.json()
                if "results" in data and len(data["results"]) > 0:
                    return {
                        "lat": float(data["results"][0]["latitude"]), 
                        "lon": float(data["results"][0]["longitude"])
                    }
                return {"error": "Location not found"}
            else:
                return {"error": "Geocoding service unavailable"}
        except Exception as e:
            return {"error": str(e)}

@router.get("/airport/nearest")
async def get_nearest_airport(lat: float, lon: float):
    """Detects nearest commercial airport IATA code using Amadeus."""
    iata = await location_service.get_nearest_airport(lat, lon)
    if iata:
        return {"iata": iata}
    return {"iata": None}