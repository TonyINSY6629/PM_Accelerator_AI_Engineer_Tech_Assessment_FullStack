# validating user input, specific error type for the date range of this project
from datetime import date, timedelta

MIN_DATE = date(1940, 1, 1)
MAX_FORECAST_DAYS = 16


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