-- Check the ERD & Relations Diagram --

/* ============================================================
   Weather App — database schema
   SQLite. Run on every startup; CREATE TABLE IF NOT EXISTS
   makes the first runs to build the tables.
   Every run after is a harmless no-op
   ============================================================ */


CREATE TABLE IF NOT EXISTS location (
    location_id INTEGER PRIMARY KEY,
    latitude    REAL NOT NULL,
    longitude   REAL NOT NULL,
    name        TEXT NOT NULL,
    state       TEXT,
    country     TEXT NOT NULL,
    zip_code    TEXT,
    timezone    TEXT,
    created_at  TEXT NOT NULL,
    UNIQUE (latitude, longitude)

    /* each location_id equals a unique pair of lat-long,
    so that different pairs might share one same name (city/town),
    but no identical pairs of lat-long ever.
    */
);

CREATE TABLE IF NOT EXISTS session (
    session_id INTEGER PRIMARY KEY,
    started_at TEXT NOT NULL,
    time_zone  TEXT,
    ended_at   TEXT -- is not NOT NULL because the session is not ended yet during visit
);

CREATE TABLE IF NOT EXISTS weather_codes (
    weather_code INTEGER PRIMARY KEY,
    description  TEXT NOT NULL,
    icon         TEXT
);

CREATE TABLE IF NOT EXISTS lookup (
    lookup_id         INTEGER PRIMARY KEY,
    session_id        INTEGER NOT NULL,
    location_id       INTEGER NOT NULL,
    raw_query         TEXT NOT NULL,
    start_date        TEXT NOT NULL,
    end_date          TEXT NOT NULL,
    current_temp      REAL,
    current_condition TEXT,
    current_icon      TEXT,
    observed_at       TEXT,
    created_at        TEXT NOT NULL,
    notes             TEXT,
    FOREIGN KEY (session_id)  REFERENCES session (session_id),
    FOREIGN KEY (location_id) REFERENCES location (location_id),
    CHECK (start_date <= end_date)
);

CREATE TABLE IF NOT EXISTS daily_weather (
    daily_id          INTEGER PRIMARY KEY,
    lookup_id         INTEGER NOT NULL,
    weather_code      INTEGER,
    date              TEXT NOT NULL,
    temp_min          REAL,
    temp_max          REAL,
    temp_mean         REAL,
    precipitation_sum REAL,
    wind_speed_max    REAL,
    source            TEXT NOT NULL DEFAULT 'open-meteo',
    fetched_at        TEXT NOT NULL,
    FOREIGN KEY (lookup_id) REFERENCES lookup (lookup_id) ON DELETE CASCADE, -- CRU"D": when a row in LOOKUP is deleted, SQLite automatically deletes every DAILY_WEATHER row that pointed at it.
    FOREIGN KEY (weather_code) REFERENCES weather_codes (weather_code),
    UNIQUE (lookup_id, date)
);

CREATE TABLE IF NOT EXISTS export_log (
    export_id   INTEGER PRIMARY KEY,
    session_id  INTEGER NOT NULL,
    lookup_id   INTEGER NOT NULL,
    format      TEXT NOT NULL,
    row_count   INTEGER,
    exported_at TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES session (session_id),
    FOREIGN KEY (lookup_id)  REFERENCES lookup (lookup_id) ON DELETE CASCADE, -- same as DAILY_WEATHER, if a LOOKUP row got deleted the export log related to that lookup_id will also be deleted
    CHECK (format IN ('csv', 'json', 'xml', 'markdown', 'pdf'))
);