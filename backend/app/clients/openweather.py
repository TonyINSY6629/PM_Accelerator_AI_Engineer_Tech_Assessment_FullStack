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
REVERSE_GEOCODE_URL = "https://api.openweathermap.org/geo/1.0/reverse" # -------coordinates back to a place name, for the browser's "use my current location"
ZIP_GEOCODE_URL = "https://api.openweathermap.org/geo/1.0/zip" # ---------------postal codes have their own endpoint; sending "10001" to /direct returned a village in Ireland, which is worse than returning nothing
CURRENT_WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"

# both geocoding directions answer with the same object shape, so they share one reader
def parse_geocode_matches(fetched_data: list) -> list[dict]:
    matches = []
    labels_already_seen = set() # --------------------------------------------OpenWeather returns "Paris, Ile-de-France, FR" three times out of five results, twice at identical coordinates and once at a point 3 km away.
                                # --------------------------------------------Deduplicating on the label the user actually reads collapses all three; deduplicating on coordinates would leave two rows looking identical.
                                # --------------------------------------------The discarded point is a few kilometres from the one kept, which does not matter for weather at city scale.
    for each_match in fetched_data:
        label = (each_match["name"], each_match.get("state"), each_match["country"])
        if label in labels_already_seen:
            continue
        labels_already_seen.add(label)

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

    return parse_geocode_matches(response.json()) # ----------------------------the shared reader, so the 4-decimal rounding and the duplicate-label filter apply to typed searches exactly as they do to coordinate lookups

# OpenWeather Reverse Geocoding
def reverse_geocode_location(latitude: float, longitude: float, limit: int = 1) -> list[dict]:
    params = { # -------------------------------------------------------------limit defaults to 1 because the browser hands over one position, not a question with several plausible answers
        "lat": latitude,
        "lon": longitude,
        "limit": limit,
        "appid": OPENWEATHER_API_KEY,
    }
    response = requests.get(REVERSE_GEOCODE_URL, params=params, timeout=10)
    response.raise_for_status()

    return parse_geocode_matches(response.json())

# OpenWeather Postal Code Geocoding
def zip_geocode_location(postal_code: str, country_code: str = "US") -> list[dict]:
    params = {
        "zip": f"{postal_code},{country_code}", # ----------------------------OpenWeather's convention is one combined parameter, not two separate ones
        "appid": OPENWEATHER_API_KEY,
    }
    response = requests.get(ZIP_GEOCODE_URL, params=params, timeout=10)

    if response.status_code == 404: # ----------------------------------------an unrecognised postal code is answered with 404, which means "no such place" and not "the provider is broken", so it must not be allowed to become a 502
        return []

    response.raise_for_status()

    return parse_geocode_matches([response.json()]) # ------------------------this endpoint answers with a single object rather than a list, and carries no "state"; both are already tolerated by the shared reader

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
    print(reverse_geocode_location(40.8467, -73.8786)) # ---------------the same coordinates back the other way, so the round trip can be eyeballed