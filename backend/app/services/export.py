import csv
import io

from app.db import repository

# for CSV format
CSV_HEADERS = [
    "date",
    "location",
    "state",
    "country",
    "temp_min",
    "temp_max",
    "temp_mean",
    "condition",
    "precipitation_mm",
    "wind_speed_max",
    "source",
    "fetched_at",
]

# Load a complete record and write it as CSV text, header row plus one row per day
# will return the whole thing as a string so that ot goes straight to HTTP response instead of exists in my disk
# Returns None if the lookup doesn't exist, matching the pattern of every other read.
def export_lookup_to_csv(lookup_id: int) -> tuple[str, int] | None:
    record = repository.get_lookup(lookup_id)
    if record is None:
        return None

    output = io.StringIO()
    writer = csv.writer(output) # --------------------------------not ",".join() bc csv.writer() handles handles quoting, escaping, and line endings better
    writer.writerow(CSV_HEADERS)

    for each_day in record["daily"]:
        writer.writerow([
            each_day["date"],
            record["location_name"],
            record["state"],
            record["country"],
            each_day["temp_min"],
            each_day["temp_max"],
            each_day["temp_mean"],
            each_day["condition"],
            each_day["precipitation_sum"],
            each_day["wind_speed_max"],
            each_day["source"],
            each_day["fetched_at"],
        ])

    return output.getvalue(), len(record["daily"]) # -------------a two-value tuple or nothing