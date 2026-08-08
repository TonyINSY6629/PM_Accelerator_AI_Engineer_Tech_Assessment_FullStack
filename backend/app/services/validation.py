# validating user input, specific error type for the date range of this project
import re
from datetime import date, timedelta

MIN_DATE = date(1940, 1, 1)
MAX_FORECAST_DAYS = 16

COORDINATE_PATTERN = re.compile(r"^\s*(-?\d+(?:\.\d+)?)[,;\s]+(-?\d+(?:\.\d+)?)\s*$") # ----two signed numbers separated by a comma, a semicolon, or spaces
POSTAL_CODE_PATTERN = re.compile(r"^\s*([0-9][0-9\- ]{2,9})\s*(?:,\s*([A-Za-z]{2})\s*)?$") # ----begins with a digit, so it cannot be confused with a place name, and may be followed by a two-letter country


class ValidationError(Exception):
    pass


def validate_date_range(start_date: str, end_date: str) -> None:
    try:
        parsed_start = date.fromisoformat(start_date)
        parsed_end = date.fromisoformat(end_date)
    except ValueError:
        raise ValidationError("Dates must be in YYYY-MM-DD format.")

    if parsed_start > parsed_end:
        raise ValidationError("Start date must be on or before end date.")

    if parsed_start < MIN_DATE:
        raise ValidationError(f"Start date cannot be earlier than {MIN_DATE.isoformat()}.")

    latest_allowed = date.today() + timedelta(days=MAX_FORECAST_DAYS)
    if parsed_end > latest_allowed:
        raise ValidationError(f"End date cannot be later than {latest_allowed.isoformat()}.")


# deciding whether the user typed a place name or a pair of coordinates, so the caller knows which lookup to perform
def parse_coordinates(raw_text: str) -> tuple[float, float] | None:
    match = COORDINATE_PATTERN.match(raw_text)
    if match is None:
        return None # ------------------------------------------------------not two numbers, so it is a place name and the caller should search by name

    latitude = float(match.group(1))
    longitude = float(match.group(2))

    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180): # ----------someone who types two numbers meant coordinates, so saying which bound was broken is more useful than falling through to a name search, which answered "200,300" with a town in Slovenia
        raise ValidationError(
            "Latitude must be between -90 and 90, and longitude between -180 and 180."
        )

    return latitude, longitude


# same idea for postal codes, which OpenWeather answers from a different endpoint than place names
def parse_postal_code(raw_text: str) -> tuple[str, str] | None:
    match = POSTAL_CODE_PATTERN.match(raw_text)
    if match is None:
        return None

    postal_code = match.group(1).strip()
    country_code = (match.group(2) or "US").upper() # -----------------------OpenWeather itself assumes the United States when no country is given, so the same assumption is made here and documented rather than hidden

    return postal_code, country_code