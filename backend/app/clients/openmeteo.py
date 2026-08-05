import requests

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"

DAILY_VARIABLES = [
    "temperature_2m_max",
    "temperature_2m_min",
    "temperature_2m_mean",
    "weather_code",
    "precipitation_sum",
    "wind_speed_10m_max",
]

# fetching daily temp off the internet
# lat & long are floats for SQL UNIQUE, start & end dates for SQL TEXT
def fetch_daily(latitude: float, longitude: float, start_date: str, end_date: str) -> dict:
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": start_date,
        "end_date": end_date,
        "daily": ",".join(DAILY_VARIABLES), # ---------------turning your six-item list into one comma-separated string.
        "timezone": "auto",
    }
    response = requests.get(FORECAST_URL, params=params, timeout=10)
    response.raise_for_status() # ---------------------------if any error
    return response.json()

def parse_daily(fetched_data: dict) -> list[dict]: # --------fetched from HTTP via fetch_daily
    daily = fetched_data["daily"]
    rows = []
    for i in range(len(daily["time"])):
        rows.append({
            "date": daily["time"][i],
            "temp_max": daily["temperature_2m_max"][i],
            "temp_min": daily["temperature_2m_min"][i],
            "temp_mean": daily["temperature_2m_mean"][i],
            "weather_code": daily["weather_code"][i],
            "precipitation_sum": daily["precipitation_sum"][i],
            "wind_speed_max": daily["wind_speed_10m_max"][i],
        })
    return rows

if __name__ == "__main__":
    fetched_data = fetch_daily(40.8501, -73.8662, "2026-08-03", "2026-08-07")
    for each_row in parse_daily(fetched_data):
        print(each_row)