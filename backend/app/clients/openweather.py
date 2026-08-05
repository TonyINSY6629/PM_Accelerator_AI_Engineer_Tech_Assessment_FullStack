import os
from pathlib import Path

import requests
from dotenv import load_dotenv

from datetime import datetime, timezone


# API
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BACKEND_DIR / ".env")

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

if not OPENWEATHER_API_KEY:
    raise RuntimeError("OPENWEATHER_API_KEY is missing. Create backend/.env and add it.")

GEOCODE_URL = "https://api.openweathermap.org/geo/1.0/direct"
CURRENT_WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"

# OpenWeather Geocoding
def geocode_location(query: str, limit: int = 5) -> list[dict]: # -----------limit is 5 because of OpenWeather's maximum
    params = {
        "q": query,
        "limit": limit,
        "appid": OPENWEATHER_API_KEY, # -------------------------------------OpenWeather's convention,
                                      # source: https://openweathermap.org/api/one-call-4?collection=one_call_api#69f0b62512431100015803ee
    }
    response = requests.get(GEOCODE_URL, params=params, timeout=10)
    response.raise_for_status()

    matches = []
    for each_match in response.json():
        matches.append({
            "name": each_match["name"],
            "state": each_match.get("state"), # ------------------------------.get() for avoiding KeyError and mirroring SQL TEXT and nullable,
                                              # -------------------------------since OpenWeather omits "state" whenever unavailable (or non-US results, tested),
                                              # -------------------------------source: https://openweathermap.org/api/geocoding-api?collection=other

            "country": each_match["country"], # -------------------------------SQL NOT NULL, so it's needed
            "latitude": round(each_match["lat"], 4), # ------------------------keeping it 4 decimals
            "longitude": round(each_match["lon"], 4),
        })
    return matches

# fetching current weather
def fetch_current_weather(latitude: float, longitude: float) -> dict: # -------using lat-long as intended
    params = {
        "lat": latitude,
        "lon": longitude,
        "units": "metric",
        "appid": OPENWEATHER_API_KEY,
    }
    response = requests.get(CURRENT_WEATHER_URL, params=params, timeout=10)
    response.raise_for_status()
    fetched_data = response.json()

    return {
        "current_temp": fetched_data["main"]["temp"],
        "current_condition": fetched_data["weather"][0]["description"], # -----fetch only the first one since OpenWeather only allow one for free API
        "current_icon": fetched_data["weather"][0]["icon"],
        "observed_at": datetime.fromtimestamp(
            fetched_data["dt"], tz=timezone.utc
        ).isoformat(), # -------------------------------------------------------render it as a standard string
    }

if __name__ == "__main__":
    for each_match in geocode_location("bronx"):
        print(each_match)
    print(fetch_current_weather(40.8467, -73.8786))