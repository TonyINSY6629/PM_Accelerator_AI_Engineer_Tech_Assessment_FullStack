from datetime import datetime, timezone

from app.db.database import get_connection

# update or insert the id, depending on if already existed or not
def upsert_location(location_data: dict) -> int:
    connection = get_connection()

    # query template, what user types in will be a raw query
    existing_row = connection.execute(
        "SELECT location_id FROM location WHERE latitude = ? AND longitude = ?",
        (location_data["latitude"], location_data["longitude"]),
    ).fetchone()

    if existing_row is not None: # ----------------------------returns nothing if nothing matched
        connection.close()
        return existing_row["location_id"] # ------------------if found, reuse the location_id

    cursor = connection.execute(
        """
        INSERT INTO location (latitude, longitude, name, state, country, timezone, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            location_data["latitude"],
            location_data["longitude"],
            location_data["name"],
            location_data.get("state"),
            location_data["country"],
            location_data.get("timezone"),
            datetime.now(timezone.utc).isoformat(),
        ),
    )
    connection.commit() # ---------------------------------------to make sure the "INSERT" did happen
    new_location_id = cursor.lastrowid # ------------------------the id SQL just generated to be added as a new lookup.location_id
    connection.close()
    return new_location_id

# recording session, each visit by the user
def create_session(time_zone: str | None = None) -> int:
    connection = get_connection()
    cursor = connection.execute(
        "INSERT INTO session (started_at, time_zone) VALUES (?, ?)",
        (datetime.now(timezone.utc).isoformat(), time_zone),
    )
    connection.commit()
    new_session_id = cursor.lastrowid
    connection.close()
    return new_session_id

# recording users' lookup for the current weather
def insert_lookup(
    session_id: int,
    location_id: int,
    raw_query: str,
    start_date: str,
    end_date: str,
    current_weather: dict | None = None,
    notes: str | None = None,
) -> int:
    weather = current_weather or {} # ----------------------if none, use an empty dict
    connection = get_connection()
    cursor = connection.execute(
        """
        INSERT INTO lookup (
            session_id, location_id, raw_query, start_date, end_date,
            current_temp, current_condition, current_icon, observed_at,
            created_at, notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            session_id,
            location_id,
            raw_query,
            start_date,
            end_date,
            weather.get("current_temp"),
            weather.get("current_condition"),
            weather.get("current_icon"),
            weather.get("observed_at"),
            datetime.now(timezone.utc).isoformat(),
            notes,
        ),
    )
    connection.commit()
    new_lookup_id = cursor.lastrowid
    connection.close()
    return new_lookup_id

# recording fetched daily weather data
def insert_daily_rows(lookup_id: int, daily_rows: list[dict]) -> int:
    fetched_at = datetime.now(timezone.utc).isoformat()

    values_to_insert = []
    for each_row in daily_rows:
        values_to_insert.append((
            lookup_id,
            each_row["weather_code"],
            each_row["date"],
            each_row["temp_min"],
            each_row["temp_max"],
            each_row["temp_mean"],
            each_row["precipitation_sum"],
            each_row["wind_speed_max"],
            "open-meteo",
            fetched_at,
        ))

    connection = get_connection()
    connection.executemany( # --------------------------------one statement but many set of values
        """
        INSERT OR REPLACE INTO daily_weather (
            lookup_id, weather_code, date, temp_min, temp_max, temp_mean,
            precipitation_sum, wind_speed_max, source, fetched_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        values_to_insert,
    )
    connection.commit()
    connection.close()
    return len(daily_rows)

# returning a list of data of user's each look up, one row per search event,
# and joins in the stable location facts resolved from geocoding and identified by a unique lat/long pair
# each row reads is a complete record of what the user asked for and where it turned out to be.
def list_lookups() -> list[dict]:
    connection = get_connection()
    rows = connection.execute(
        """
        SELECT
            lookup.lookup_id,
            lookup.raw_query,
            lookup.start_date,
            lookup.end_date,
            lookup.current_temp,
            lookup.current_condition,
            lookup.current_icon,
            lookup.created_at,
            lookup.notes,
            location.name AS location_name,
            location.state,
            location.country
        FROM lookup
        JOIN location ON location.location_id = lookup.location_id
        ORDER BY lookup.created_at DESC
        """
    ).fetchall()
    connection.close()

    lookups_found = []
    for each_row in rows:
        lookups_found.append(dict(each_row))
    return lookups_found

# converting between a lookup table in db and an API nested document object (object–relational impedance mismatch)
def get_lookup(lookup_id: int) -> dict | None:
    connection = get_connection()

    lookup_row = connection.execute(
        """
        SELECT
            lookup.*,
            location.name AS location_name,
            location.state,
            location.country,
            location.latitude,
            location.longitude,
            location.timezone
        FROM lookup
        JOIN location ON location.location_id = lookup.location_id
        WHERE lookup.lookup_id = ?
        """,
        (lookup_id,), # ---------------------------------------a one-value tuple so it's fixed, one-value parameter
    ).fetchone() # ------------------------------------------------------fetching one lookup at a time

    if lookup_row is None:
        connection.close()
        return None

    daily_rows = connection.execute(
        """
        SELECT
            daily_weather.date,
            daily_weather.temp_min,
            daily_weather.temp_max,
            daily_weather.temp_mean,
            daily_weather.precipitation_sum,
            daily_weather.wind_speed_max,
            daily_weather.source,
            daily_weather.fetched_at,
            weather_codes.description AS condition,
            weather_codes.icon
        FROM daily_weather
        LEFT JOIN weather_codes ON weather_codes.weather_code = daily_weather.weather_code
        WHERE daily_weather.lookup_id = ?
        ORDER BY daily_weather.date
        """,
        (lookup_id,),
    ).fetchall() # ----------------------------------------------------------LOOKUP to DAILY_WEATHER is mandatory one-to-many (check ERD)
    connection.close()

    complete_record = dict(lookup_row)
    complete_record["daily"] = []
    for each_row in daily_rows:
        complete_record["daily"].append(dict(each_row))
    return complete_record

# deletes one lookup row by id and reports TRUE if anything was actually removed FALSE if no such row exists
def delete_lookup(lookup_id: int) -> bool:
    connection = get_connection()
    cursor = connection.execute(
        "DELETE FROM lookup WHERE lookup_id = ?",
        (lookup_id,),
    )
    connection.commit()
    deleted_count = cursor.rowcount
    connection.close()
    return deleted_count > 0 # ----------------------making sure 404 is returned if no row was deleted

# overwriting five columns on one lookup row and reports whether that row existed.
def update_lookup( # --------------------------------------------------------------CR "U" D
    lookup_id: int,
    location_id: int, # -----------------------------------------------------------if the user misclicked on another location
    raw_query: str,
    start_date: str, # ------------------------------------------------------------if the user wants to update the time range
    end_date: str,
    notes: str | None, # ----------------------------------------------------------any note the user can add, can be a label such as "travel" or "work"
) -> bool:
    connection = get_connection()
    cursor = connection.execute(
        """
        UPDATE lookup
        SET location_id = ?,
            raw_query = ?,
            start_date = ?,
            end_date = ?,
            notes = ?
        WHERE lookup_id = ?
        """,
        (location_id, raw_query, start_date, end_date, notes, lookup_id), # ----------a five-value tuple, in order
    )
    connection.commit()
    updated_count = cursor.rowcount
    connection.close()
    return updated_count > 0

# deleting every DAILY_WEATHER row belonging to one lookup, and returns how many it removed
def delete_daily_rows(lookup_id: int) -> int: # -----------------------------------not a boolean bc if no row (0) deleted would be a 404 error
                                              # -----------------------------------if there is a change of date range, the overlapped days' old data have to be deleted
                                              # -----------------------------------before the newly fetched data to avoid key and already_exist error
    connection = get_connection()
    cursor = connection.execute(
        "DELETE FROM daily_weather WHERE lookup_id = ?",
        (lookup_id,),
    )
    connection.commit()
    deleted_count = cursor.rowcount
    connection.close()
    return deleted_count

# overwriting the four columns of the current_weather snapshot fetched previously
# allowing None in case OpenWeather gives back nothing
def update_lookup_current_weather(lookup_id: int, current_weather: dict | None) -> bool:
    weather = current_weather or {}
    connection = get_connection()
    cursor = connection.execute(
        """
        UPDATE lookup
        SET current_temp = ?,
            current_condition = ?,
            current_icon = ?,
            observed_at = ?
        WHERE lookup_id = ?
        """,
        (
            weather.get("current_temp"),
            weather.get("current_condition"),
            weather.get("current_icon"),
            weather.get("observed_at"),
            lookup_id,
        ),
    )
    connection.commit()
    updated_count = cursor.rowcount
    connection.close()
    return updated_count > 0

# recording a happened export,
def insert_export_log(
    session_id: int,
    lookup_id: int,
    export_format: str,
    row_count: int,
) -> int:
    connection = get_connection()
    cursor = connection.execute(
        """
        INSERT INTO export_log (session_id, lookup_id, format, row_count, exported_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            session_id,
            lookup_id,
            export_format.lower(),
            row_count,
            datetime.now(timezone.utc).isoformat(),
        ),
    )
    connection.commit()
    new_export_id = cursor.lastrowid
    connection.close()
    return new_export_id


if __name__ == "__main__":
    from app.clients.openmeteo import fetch_daily, parse_daily
    from app.clients.openweather import geocode_location, fetch_current_weather

    matches = geocode_location("bronx", limit=1)
    chosen_location = matches[0]

    session_id = create_session("America/New_York")
    location_id = upsert_location(chosen_location)

    current_weather = fetch_current_weather(
        chosen_location["latitude"], chosen_location["longitude"]
    )
    lookup_id = insert_lookup(
        session_id, location_id, "bronx", "2026-08-03", "2026-08-07", current_weather
    )

    fetched_data = fetch_daily(
        chosen_location["latitude"], chosen_location["longitude"],
        "2026-08-03", "2026-08-07",
    )
    inserted_count = insert_daily_rows(lookup_id, parse_daily(fetched_data))

    print(f"session {session_id}, location {location_id}, lookup {lookup_id}")
    print(f"{inserted_count} daily rows stored")

