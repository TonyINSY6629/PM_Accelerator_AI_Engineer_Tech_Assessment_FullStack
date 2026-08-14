# Backend image for Fly.io. The frontend is deployed separately to Cloudflare Workers.
FROM python:3.13-slim

WORKDIR /app

# Dependencies are copied and installed before the source, so editing application
# code does not invalidate the cached install layer on every rebuild
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ ./backend/

# The SQLite file defaults to living inside the source tree, which a container
# filesystem does not preserve between restarts. /data is a mounted volume, so the
# saved lookups survive a redeploy; the schema still rebuilds itself on first start
ENV WEATHER_DB_PATH=/data/weather.db

# Fly routes to 8080 by default; --host 0.0.0.0 is required because the default
# 127.0.0.1 would only accept connections from inside the container
EXPOSE 8080
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--app-dir", "backend"]
