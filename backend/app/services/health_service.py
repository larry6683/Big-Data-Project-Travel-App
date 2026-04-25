import httpx
import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import SystemHealthStatus
from app.db.database import SessionLocal 

class HealthService:
    def __init__(self):
        self.cache_ttl = timedelta(hours=48)

    async def ping_external_apis(self, db: Session, target_api: str = None):
        """Pings external APIs and saves the result to DB with individual timestamps."""
        print(f"🔄 [HEALTH] Pinging {'API: ' + target_api if target_api else 'all external APIs'}...")
        
        results = {}
        timeout = 10.0
        current_time_iso = datetime.now(timezone.utc).isoformat()

        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                all_checks = {
                    "OpenWeather": client.get(f"https://pro.openweathermap.org/data/2.5/weather?lat=0&lon=0&appid={settings.WEATHER_API_KEY or ''}"),
                    "SerpApi": client.get(f"https://serpapi.com/search.json?engine=google&q=test&api_key={settings.SERPAPI_KEY or ''}"),
                    "BigDataCloud": client.get(f"https://api-bdc.net/data/reverse-geocode?latitude=0&longitude=0&key={settings.BDC_API_KEY or ''}"),
                    "AirLabs": client.get(f"https://airlabs.co/api/v9/ping?api_key={settings.AIRLABS_API_KEY or ''}"),
                    "Amadeus_Auth": client.post("https://api.amadeus.com/v1/security/oauth2/token", data={
                        "grant_type": "client_credentials",
                        "client_id": settings.AMADEUS_CLIENT_ID or "",
                        "client_secret": settings.AMADEUS_CLIENT_SECRET or ""
                    }),
                    "OSM_Overpass": client.get("https://overpass-api.de/api/status"),
                    "Mapbox": client.get(f"https://api.mapbox.com/directions/v5/mapbox/driving/0,0;1,1?access_token={settings.MAPBOX_API_KEY or ''}"),
                    "OpenAI": client.get("https://api.openai.com/v1/models", headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY or ''}"})
                }

                if target_api and target_api in all_checks:
                    checks = {target_api: all_checks[target_api]}
                else:
                    checks = all_checks

                keys = list(checks.keys())
                responses = await asyncio.gather(*checks.values(), return_exceptions=True)

                for key, response in zip(keys, responses):
                    if isinstance(response, Exception):
                        print(f"⚠️ [HEALTH] {key} ping failed: {str(response)}")
                        results[key] = {
                            "status": "DOWN", 
                            "error": str(response),
                            "last_checked": current_time_iso
                        }
                    else:
                        is_up = response.status_code < 500
                        print(f"📡 [HEALTH] {key} responded with HTTP {response.status_code} ({'UP' if is_up else 'DOWN'})")
                        results[key] = {
                            "status": "UP" if is_up else "DOWN",
                            "status_code": response.status_code,
                            "last_checked": current_time_iso
                        }

            # --- DATABASE SAVE LOGIC ---
            status_record = db.query(SystemHealthStatus).first()
            if not status_record:
                status_record = SystemHealthStatus(health_data={})
                db.add(status_record)

            current_data = dict(status_record.health_data) if status_record.health_data else {}
            for k, v in results.items():
                current_data[k] = v
            
            status_record.health_data = current_data
            
            if not target_api:
                status_record.last_checked = datetime.now(timezone.utc)
                
            db.commit()
            print(f"✅ [HEALTH] {'API ' + target_api if target_api else 'External APIs'} check complete.")
            
        except Exception as e:
            print(f"❌ [HEALTH] Critical error during ping loop: {str(e)}")

    async def _background_ping(self):
        db = SessionLocal()
        try:
            await self.ping_external_apis(db)
        finally:
            db.close()

    async def get_system_health(self):
        frontend_status = "DOWN"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(settings.FRONTEND_URL)
                if res.status_code < 500:
                    frontend_status = "UP"
                print(f"📡 [HEALTH] Internal Frontend responded with HTTP {res.status_code} ({frontend_status})")
        except Exception as e:
            print(f"⚠️ [HEALTH] Internal Frontend ping failed: {str(e)}")

        print("📡 [HEALTH] Internal Backend check: UP (Self-responsive)")

        # Internal APIs get live timestamps every time they are checked
        return {
            "backend_api": {"status": "UP", "timestamp": datetime.now(timezone.utc).isoformat()},
            "frontend_app": {"status": frontend_status, "timestamp": datetime.now(timezone.utc).isoformat()}
        }

    async def get_full_health_report(self, db: Session, background_tasks, force_refresh: bool = False, target_api: str = None):
        now = datetime.now(timezone.utc)
        
        status_record = db.query(SystemHealthStatus).first()
        last_checked = status_record.last_checked if status_record else None
        cached_health = status_record.health_data if status_record else {}

        if last_checked and last_checked.tzinfo is None:
            last_checked = last_checked.replace(tzinfo=timezone.utc)
        
        is_expired = not last_checked or (now - last_checked) > self.cache_ttl

        if target_api:
            if target_api in ["backend_api", "frontend_app"]:
                pass 
            else:
                await self.ping_external_apis(db, target_api)
                status_record = db.query(SystemHealthStatus).first()
                cached_health = status_record.health_data if status_record else {}
                last_checked = status_record.last_checked if status_record else None
        
        elif force_refresh or is_expired:
            if force_refresh:
                await self.ping_external_apis(db)
                status_record = db.query(SystemHealthStatus).first()
                last_checked = status_record.last_checked
                cached_health = status_record.health_data
            else:
                background_tasks.add_task(self._background_ping)
                if not cached_health:
                    cached_health = {"status": "Pinging APIs in background, please refresh in 10 seconds."}

        internal_health = await self.get_system_health()

        return {
            "internal_system": internal_health,
            "external_apis": cached_health,
            "external_apis_last_checked": last_checked.isoformat() if last_checked else None,
            "next_external_check_due": (last_checked + self.cache_ttl).isoformat() if last_checked else "Now"
        }

health_service = HealthService()