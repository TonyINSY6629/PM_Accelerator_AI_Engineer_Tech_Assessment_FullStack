# actual looking-up, using the functions created before
import requests

from app.clients.openmeteo import fetch_daily, parse_daily
from app.clients.openweather import fetch_current_weather, geocode_location
from app.db import repository
from app.services.validation import ValidationError, validate_date_range


def create_lookup(
    session_id: int,
    raw_query: str,
    start_date: str,
    end_date: str,
    chosen_location: dict | None = None,
    notes: str | None = None,
) -> int:
    validate_date_range(start_date, end_date)

    if chosen_location is None:
        matches = geocode_location(raw_query, limit=5)
        if not matches:
            raise ValidationError(f"No location found for '{raw_query}'.")
        chosen_location = matches[0]

    latitude = chosen_location["latitude"]
    longitude = chosen_location["longitude"]

    fetched_data = fetch_daily(latitude, longitude, start_date, end_date)

    location_to_store = dict(chosen_location)
    location_to_store["timezone"] = fetched_data.get("timezone")
    location_id = repository.upsert_location(location_to_store)

    try:
        current_weather = fetch_current_weather(latitude, longitude)
    except requests.RequestException:
        current_weather = None

    lookup_id = repository.insert_lookup(
        session_id, location_id, raw_query, start_date, end_date, current_weather, notes
    )
    repository.insert_daily_rows(lookup_id, parse_daily(fetched_data))

    return lookup_id

# validating the new dates for an existing record that the user is updating, re-fetches Open-Meteo for the same coordinates
# returns the complete updated record after deleting the old rows and inserting the new rows
def update_lookup(
    lookup_id: int,
    start_date: str,
    end_date: str,
    notes: str | None = None,
    raw_query: str | None = None,
    chosen_location: dict | None = None,
) -> dict | None:
    existing_record = repository.get_lookup(lookup_id)
    if existing_record is None:
        return None

    validate_date_range(start_date, end_date)

    if chosen_location is None and raw_query:
        matches = geocode_location(raw_query, limit=5)
        if not matches:
            raise ValidationError(f"No location found for '{raw_query}'.")
        chosen_location = matches[0]

    location_has_changed = chosen_location is not None

    # updating lat-long
    if location_has_changed:
        latitude = chosen_location["latitude"]
        longitude = chosen_location["longitude"]
    else:
        latitude = existing_record["latitude"]
        longitude = existing_record["longitude"]

    fetched_data = fetch_daily(latitude, longitude, start_date, end_date)

    if location_has_changed:
        location_to_store = dict(chosen_location)
        location_to_store["timezone"] = fetched_data.get("timezone")
        location_id = repository.upsert_location(location_to_store)
        query_to_store = raw_query or chosen_location["name"]
    else:
        location_id = existing_record["location_id"]
        query_to_store = existing_record["raw_query"]

    repository.update_lookup(
        lookup_id=lookup_id,
        location_id=location_id,
        raw_query=query_to_store,
        start_date=start_date,
        end_date=end_date,
        notes=notes,
    )

    repository.delete_daily_rows(lookup_id)
    repository.insert_daily_rows(lookup_id, parse_daily(fetched_data))

    if location_has_changed:
        try:
            current_weather = fetch_current_weather(latitude, longitude)
        except requests.RequestException:
            current_weather = None
        repository.update_lookup_current_weather(lookup_id, current_weather)

    return repository.get_lookup(lookup_id)