# YouTube Data API v3 — walking-tour videos for a city, as the bonus media integration
import os
from pathlib import Path

import requests
from dotenv import load_dotenv

import html

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BACKEND_DIR / ".env")

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY") # ---------------------------deliberately NOT raising when missing, unlike OpenWeather: videos are a bonus, and an absent key must never stop the weather app from starting

SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"

# the same shape-flattening idea as parse_geocode_matches: keep only what the frontend renders
def parse_videos(fetched_data: dict) -> list[dict]:
    videos = []
    for each_item in fetched_data.get("items", []): # ----------------------.get() with a default because a search that matched nothing omits "items" entirely
        snippet = each_item["snippet"]
        videos.append({
            "video_id": each_item["id"]["videoId"], # ----------------------what the embed iframe needs
            "title": html.unescape(snippet["title"]), # -------------------YouTube escapes titles for HTML; undoing it here means the frontend can use textContent and stay safe from injection
            "channel_title": html.unescape(snippet["channelTitle"]), # --------------------YouTube's own casing, camelCase, so it is renamed here to match this project's convention
            "thumbnail_url": snippet["thumbnails"]["medium"]["url"],
        })
    return videos

cached_results: dict[str, list[dict]] = {} # -------------------------------module-level, so it survives between requests but dies with the process

def search_walking_tour(city_name: str, country: str, state: str | None = None, max_results: int = 3) -> list[dict]:
    cache_key = f"{city_name}, {state or '-'}, {country}" # ----------------the state belongs in the key because Paris, Texas and Paris, Kentucky are both "Paris, US"

    if state: # ------------------------------------------------------------naming the region is what stops "Paris" from always meaning France; without it, Paris, Texas returned Paris, France tours
        search_query = f"{city_name} {state} 4K walking tour"
    else: # ----------------------------------------------------------------OpenWeather omits state outside the US, and for a city that needs no disambiguation the bare name searches better
        search_query = f"{city_name} 4K walking tour"

    if cache_key in cached_results: # -------------------------------------- one search costs 100 of the 10,000 daily quota units, so roughly 100 searches a day exist in total
        return cached_results[cache_key]

    if not YOUTUBE_API_KEY:
        return []

    params = {
        "key": YOUTUBE_API_KEY,
        "q": search_query,
        "part": "snippet", # -----------------------------------------------the only part needed; asking for more costs more quota
        "type": "video", # -------------------------------------------------excludes channels and playlists, and is required before videoEmbeddable is allowed
        "videoEmbeddable": "true", # ---------------------------------------without this, results that forbid embedding render as a dead player instead of playing
        "maxResults": max_results,
        "safeSearch": "moderate",
    }

    try:
        response = requests.get(SEARCH_URL, params=params, timeout=10)
        response.raise_for_status()
    except requests.RequestException:
        return [] # --------------------------------------------------------quota exhausted, timeout, or provider failure: answer with nothing rather than an error, and do NOT cache it, so the next request may still succeed

    videos = parse_videos(response.json())
    cached_results[cache_key] = videos # -----------------------------------only a successful answer is remembered, including a genuine "no videos exist for this place"
    return videos

if __name__ == "__main__":
    for each_video in search_walking_tour("New York", "US", "New York"):
        print(each_video)
    print("second call hits the cache:", search_walking_tour("New York", "US", "New York") is search_walking_tour("New York", "US", "New York"))
    print("--- the case this fix exists for ---")
    for each_video in search_walking_tour("Paris", "US", "Texas"): # --------should be Texas, not France
        print(each_video["title"])