from fastapi import APIRouter
import httpx
import os
from app.services.location_service import location_service
from app.core.config import settings # 👈 1. IMPORT YOUR SETTINGS HERE

router = APIRouter()

US_STATES = {
    "AL":"Alabama","AK":"Alaska","AZ":"Arizona","AR":"Arkansas","CA":"California",
    "CO":"Colorado","CT":"Connecticut","DE":"Delaware","FL":"Florida","GA":"Georgia",
    "HI":"Hawaii","ID":"Idaho","IL":"Illinois","IN":"Indiana","IA":"Iowa",
    "KS":"Kansas","KY":"Kentucky","LA":"Louisiana","ME":"Maine","MD":"Maryland",
    "MA":"Massachusetts","MI":"Michigan","MN":"Minnesota","MS":"Mississippi","MO":"Missouri",
    "MT":"Montana","NE":"Nebraska","NV":"Nevada","NH":"New Hampshire","NJ":"New Jersey",
    "NM":"New Mexico","NY":"New York","NC":"North Carolina","ND":"North Dakota","OH":"Ohio",
    "OK":"Oklahoma","OR":"Oregon","PA":"Pennsylvania","RI":"Rhode Island","SC":"South Carolina",
    "SD":"South Dakota","TN":"Tennessee","TX":"Texas","UT":"Utah","VT":"Vermont",
    "VA":"Virginia","WA":"Washington","WV":"West Virginia","WI":"Wisconsin","WY":"Wyoming",
}
STATE_NAMES = set(US_STATES.values())
JUNK = STATE_NAMES | {"united states", "united states of america", "unknown", ""}

def resolve_state(raw: str) -> str:
    if not raw:
        return ""
    s = raw.strip().upper().replace("US-", "")
    if s in US_STATES:
        return US_STATES[s]
    title = raw.strip().title()
    if title in STATE_NAMES:
        return title
    return raw.strip()

def valid_name(name: str, state: str) -> bool:
    n = (name or "").strip()
    return bool(n) and n.lower() not in {j.lower() for j in JUNK} and n != state

def parse_bdc(data: dict) -> tuple[str | None, str]:
    """
    Extract best city from BDC response by strictly checking administrative boundaries,
    ignoring the polluted `city` or `locality` fields which often contain apartment names.
    """
    raw   = (data.get("principalSubdivisionCode") or data.get("principalSubdivision") or "")
    state = resolve_state(raw)
    ok    = lambda n: valid_name(n, state)

    entries: list = (data.get("localityInfo") or {}).get("administrative") or []
    
    # 1. Force extraction of actual City/Town boundaries (Admin Levels 8, 7, 9)
    # Level 8 = City/Municipality, Level 7 = Township, Level 9 = Village
    for target_level in [8, 7, 9]:
        match = next(
            (e for e in entries if (e.get("adminLevel") or 0) == target_level and ok((e.get("name") or "").strip())), 
            None
        )
        if match:
            return match["name"].strip(), state

    # 2. Emergency fallback to the generic city field only if admin boundaries fail
    city = (data.get("city") or "").strip()
    if ok(city):
        return city, state

    return None, state

async def try_bdc(client: httpx.AsyncClient, lat: float, lon: float) -> tuple[str | None, str]:
    # 2. 👈 GRAB THE KEY FROM PYDANTIC SETTINGS
    api_key = settings.BDC_API_KEY 
    
    if api_key:
        print("  [BDC] API Key loaded successfully")
        url = f"https://api.bigdatacloud.net/data/reverse-geocode?latitude={lat}&longitude={lon}&localityLanguage=en&key={api_key}"
    else:
        print("  [BDC] ⚠️ API Key NOT FOUND. Falling back to free client endpoint.")
        url = f"https://api.bigdatacloud.net/data/reverse-geocode-client?latitude={lat}&longitude={lon}&localityLanguage=en"

    try:
        r = await client.get(url, timeout=7.0)
        if r.status_code != 200:
            print(f"  [BDC] HTTP {r.status_code} - {r.text}")
            return None, ""
        city, state = parse_bdc(r.json())
        if city:
            print(f"  [BDC] ✅ {city}, {state}")
            return city, state
    except Exception as exc:
        print(f"  [BDC] exception: {exc}")
    return None, ""

@router.get("/nearest")
async def get_nearest(lat: float, lon: float):
    """Reverse geocode coordinates → nearest US city strictly using BDC."""
    print(f"\n🌍 GPS /nearest → {lat}, {lon}")
    async with httpx.AsyncClient() as client:
        city, state = await try_bdc(client, lat, lon)
        if city:
            return {"city": city, "state": state, "type": "city"}

    print("❌ BDC resolution failed")
    return {"city": None, "state": None, "type": "city"}

@router.get("/search")
async def search_locations(keyword: str):
    if not keyword:
        return []

    results: list = []
    needle = keyword.lower().strip().replace(" ", "")

    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(
                f"https://geocoding-api.open-meteo.com/v1/search?name={keyword}&count=10&format=json",
                timeout=5.0,
            )
            if r.status_code == 200:
                for d in r.json().get("results") or []:
                    city  = d.get("name", "")
                    state = d.get("admin1") or ""
                    if city and d.get("country_code") == "US" and needle in city.lower().replace(" ", ""):
                        results.append({"city": city.title(), "state": resolve_state(state)})
        except Exception as e:
            print(f"[Search] Open-Meteo error: {e}")

    try:
        for item in await location_service.search_locations(keyword):
            city = item.get("name", "")
            sc   = (item.get("address") or {}).get("stateCode", "").replace("US-", "")
            if city and needle in city.lower().replace(" ", ""):
                results.append({"city": city.title(), "state": resolve_state(sc)})
    except Exception as e:
        print(f"[Search] Amadeus error: {e}")

    seen: set = set()
    unique: list = []
    for item in results:
        key = (item["city"].lower().strip(), (item["state"] or "").lower().strip())
        if key not in seen:
            seen.add(key)
            unique.append(item)
    return unique[:4]

@router.get("/geocode")
async def geocode_location(keyword: str):
    if not keyword:
        return {"error": "No keyword provided"}

    parts      = [p.strip() for p in keyword.split(",")]
    city_name  = parts[0]
    state_hint = resolve_state(parts[1]) if len(parts) > 1 else None

    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(
                f"https://geocoding-api.open-meteo.com/v1/search?name={city_name}&count=10&format=json",
                timeout=10.0,
            )
            if r.status_code != 200:
                return {"error": "Geocoding service unavailable"}

            us = [x for x in (r.json().get("results") or []) if x.get("country_code") == "US"]
            if not us:
                return {"error": "Location not found"}

            if state_hint:
                match = [x for x in us if (x.get("admin1") or "").lower() == state_hint.lower()]
                if match:
                    us = match

            return {"lat": float(us[0]["latitude"]), "lon": float(us[0]["longitude"])}
        except Exception as e:
            return {"error": str(e)}

@router.get("/airport/nearest")
async def get_nearest_airport(lat: float, lon: float):
    iata = await location_service.get_nearest_airport(lat, lon)
    return {"iata": iata} if iata else {"iata": None}