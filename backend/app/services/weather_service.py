import httpx
from datetime import datetime, timedelta
from collections import defaultdict, Counter
from app.schemas.weather import WeatherDay, WeatherSummary
from app.core.config import settings  # <-- NEW: Import your settings

class WeatherService:
    def __init__(self):
        # NEW: Securely pull the API key from your .env file
        self.api_key = settings.WEATHER_API_KEY

    async def get_weather_for_trip(self, lat: float, lon: float, check_in_date: str, check_out_date: str):
        check_in = datetime.strptime(check_in_date, "%Y-%m-%d")
        check_out = datetime.strptime(check_out_date, "%Y-%m-%d")
        now = datetime.now()

        days_until_trip = (check_in - now).days

        # 1. Always call the Forecast API first to get the City ID
        forecast_url = "https://pro.openweathermap.org/data/2.5/forecast/climate"
        forecast_params = {
            "lat": lat, "lon": lon,
            "appid": self.api_key,
            "units": "imperial", # Use Fahrenheit for USA trips
            "cnt": 30
        }

        async with httpx.AsyncClient() as client:
            try:
                print(f"🌤️ Fetching Forecast and City ID for {lat}, {lon}")
                forecast_response = await client.get(forecast_url, params=forecast_params, timeout=15.0)
                if forecast_response.status_code != 200:
                    return {"error": "Failed to fetch data from OpenWeather."}
                
                forecast_data = forecast_response.json()
                
                # Extract the dynamic City ID
                city_id = forecast_data.get("city", {}).get("id")
                if not city_id:
                    return {"error": "Could not extract City ID from OpenWeather."}

                # PLAN A: If trip is within 30 days, parse the 30-day forecast!
                if days_until_trip <= 30:
                    return self._parse_climate_data(forecast_data, check_in_date, check_out_date)

                # PLAN B: Trip is > 30 days away. Use Historical Data by City ID!
                print(f"🕰️ Trip is > 30 days away. Fetching historical data using City ID: {city_id}")
                historical_check_in = check_in - timedelta(days=365)
                historical_check_out = check_out - timedelta(days=365)

                start_unix = int(historical_check_in.timestamp())
                # Add 1 day to checkout to ensure full 24 hours of the last day
                end_unix = int((historical_check_out + timedelta(days=1)).timestamp())

                history_url = "https://history.openweathermap.org/data/2.5/history/city"
                history_params = {
                    "id": city_id,
                    "type": "hour",
                    "start": start_unix,
                    "end": end_unix,
                    "appid": self.api_key,
                    "units": "imperial"
                }

                history_response = await client.get(history_url, params=history_params, timeout=15.0)
                if history_response.status_code == 200:
                    return self._parse_historical_data(history_response.json(), check_in_date, check_out_date)
                else:
                    return {"error": f"OpenWeather Historical API returned {history_response.status_code}: {history_response.text}"}
            except Exception as e:
                return {"error": f"Failed to fetch weather: {str(e)}"}

    def _parse_climate_data(self, data: dict, target_check_in: str, target_check_out: str):
        days = []
        check_in_dt = datetime.strptime(target_check_in, "%Y-%m-%d").date()
        check_out_dt = datetime.strptime(target_check_out, "%Y-%m-%d").date()

        for item in data.get("list", []):
            dt = datetime.fromtimestamp(item["dt"]).date()
            if check_in_dt <= dt <= check_out_dt:
                days.append(WeatherDay(
                    date=dt.strftime("%Y-%m-%d"),
                    max_temp=round(item["temp"]["max"], 1),
                    min_temp=round(item["temp"]["min"], 1),
                    weather=item["weather"][0]["description"].title(),
                    humidity=item["humidity"],
                    pressure=item["pressure"]
                ))

        if not days:
            return {"error": "Dates not found in 30-day forecast range."}

        return WeatherSummary(
            overall_summary=f"Forecast for your trip: Expect mostly {days[0].weather.lower()} conditions with highs around {int(days[0].max_temp)}°F.",
            days=days
        )

    def _parse_historical_data(self, data: dict, target_check_in: str, target_check_out: str):
        daily_data = defaultdict(lambda: {"temps": [], "humidity": [], "pressure": [], "weather": []})

        for item in data.get("list", []):
            dt = datetime.fromtimestamp(item["dt"])
            future_dt = dt + timedelta(days=365)
            date_str = future_dt.strftime("%Y-%m-%d")

            daily_data[date_str]["temps"].append(item["main"]["temp"])
            daily_data[date_str]["humidity"].append(item["main"]["humidity"])
            daily_data[date_str]["pressure"].append(item["main"]["pressure"])
            daily_data[date_str]["weather"].append(item["weather"][0]["description"])

        days = []
        for date_str, metrics in sorted(daily_data.items()):
            if target_check_in <= date_str <= target_check_out:
                most_common_weather = Counter(metrics["weather"]).most_common(1)[0][0]

                days.append(WeatherDay(
                    date=date_str,
                    max_temp=round(max(metrics["temps"]), 1),
                    min_temp=round(min(metrics["temps"]), 1),
                    weather=most_common_weather.title() + " (Historical Estimate)",
                    humidity=int(sum(metrics["humidity"]) / len(metrics["humidity"])),
                    pressure=int(sum(metrics["pressure"]) / len(metrics["pressure"]))
                ))

        if not days:
            return {"error": "Could not calculate historical forecast for these dates."}

        return WeatherSummary(
            overall_summary=f"Historical Estimate based on exactly 1 year ago: Expect highs around {int(days[0].max_temp)}°F.",
            days=days
        )

weather_service = WeatherService()