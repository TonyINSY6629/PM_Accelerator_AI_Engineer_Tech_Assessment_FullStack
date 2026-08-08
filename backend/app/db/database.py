import sqlite3
from pathlib import Path
import os

DB_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.getenv("WEATHER_DB_PATH", DB_DIR / "weather.db"))
SCHEMA_PATH = DB_DIR / "schema.sql"
SEED_PATH = DB_DIR / "seed.sql"

def get_connection() -> sqlite3.Connection: # ------------returns Connection object
    connection = sqlite3.connect(DB_PATH)   # ------------open the db file
    connection.row_factory = sqlite3.Row    # ------------sqlite3.Row converts results into a dictionary with dict(row),
                                            # ------------and FastAPI turns dictionary into JSON, crucial for REACT frontend later

    connection.execute("PRAGMA foreign_keys = ON;") # ----per connection setting, FOREIGN KEY...REFERENCES and ON DELETE CASCADE enforcement
    return connection # ----------------------------------now both Row and PRAGMA are guaranteed with each Connection

def init_db() -> None:
    connection = get_connection()
    # Creates tables
    schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")
    connection.executescript(schema_sql) # ----------------execute many SQL statements separated by semicolons
    # fills
    seed_sql = SEED_PATH.read_text(encoding="utf-8")
    connection.executescript(seed_sql)

    connection.close() # ----------------------------------releases the file for MEMORY


if __name__ == "__main__":
    init_db()
    connection = get_connection()
    count = connection.execute("SELECT COUNT(*) FROM weather_codes").fetchone()[0] # fetching one thing, the count of the rows only
    connection.close()
    print(f"Database ready at {DB_PATH}")
    print(f"weather_codes rows: {count}")