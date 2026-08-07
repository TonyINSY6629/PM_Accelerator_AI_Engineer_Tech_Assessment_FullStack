import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2, Map as MapIcon } from "lucide-react";
import type { GeocodeMatch, LookupRecord, VideoItem } from "@/lib/weather-types";
import {
  createLookup,
  deleteLookup,
  exportLookupCsv,
  geocodeForward,
  geocodeReverse,
  getLookup,
  getLookupVideos,
  listLookups,
  startSession,
  updateLookup,
} from "@/lib/weather-api";
import { clampDateRange, makeDemoLookup, offsetDate, todayIso } from "@/lib/weather-utils";
import { AboutSection } from "./AboutSection";
import { CurrentWeather } from "./CurrentWeather";
import { ForecastRow } from "./ForecastRow";
import { LookupHistory } from "./LookupHistory";
import { SearchBar } from "./SearchBar";
import { VideoDeck } from "./VideoDeck";
import { WeatherMap } from "./WeatherMap";

const DEBOUNCE_MS = 350;
const DEMO_SESSION_ID = -1;

type PageError = { status: number; detail: string } | null;

export function WeatherPage() {
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<GeocodeMatch | null>(null);
  const [suggestions, setSuggestions] = useState<GeocodeMatch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeLookupId, setActiveLookupId] = useState<number | null>(null);
  const [pageError, setPageError] = useState<PageError>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(offsetDate(4));

  // Initialize session
  useEffect(() => {
    let cancelled = false;
    startSession()
      .then((id) => {
        if (!cancelled) setSessionId(id);
      })
      .catch((err: PageError) => {
        if (!cancelled) {
          setIsDemo(true);
          setSessionId(DEMO_SESSION_ID);
          setPageError(err);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch history
  const historyQuery = useQuery({
    queryKey: ["lookups", sessionId],
    queryFn: listLookups,
    enabled: sessionId !== null && sessionId !== DEMO_SESSION_ID,
    retry: false,
  });

  // Fetch active lookup
  const activeLookupQuery = useQuery({
    queryKey: ["lookup", activeLookupId],
    queryFn: () => getLookup(activeLookupId!),
    enabled: activeLookupId !== null && activeLookupId > 0,
  });

  // Fetch videos for active lookup
  const videosQuery = useQuery({
    queryKey: ["videos", activeLookupId],
    queryFn: () => getLookupVideos(activeLookupId!),
    enabled: activeLookupId !== null && activeLookupId > 0,
  });

  // Create lookup mutation
  const createMutation = useMutation({
    mutationFn: createLookup,
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["lookups", sessionId] });
      setActiveLookupId(id);
    },
    onError: (err: PageError) => {
      setPageError(err);
    },
  });

  // Update lookup mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: Parameters<typeof updateLookup>[1] }) =>
      updateLookup(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lookups", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["lookup", activeLookupId] });
    },
  });

  // Delete lookup mutation
  const deleteMutation = useMutation({
    mutationFn: deleteLookup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lookups", sessionId] });
      if (activeLookupId && !historyQuery.data?.some((l) => l.lookup_id === activeLookupId)) {
        setActiveLookupId(null);
      }
    },
  });

  // Export CSV mutation
  const exportMutation = useMutation({
    mutationFn: async ({ id, sessionId }: { id: number; sessionId: number }) => {
      const blob = await exportLookupCsv(id, sessionId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lookup-${id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  // Debounced geocode search
  useEffect(() => {
    if (selected) return;
    if (query.trim().length < 2) {
      setSuggestions([]);
      setSearchError(null);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(() => {
      geocodeForward(query)
        .then((matches) => {
          setSuggestions(matches);
          setSearchError(null);
        })
        .catch((err: PageError) => {
          setSuggestions([]);
          setSearchError(err?.detail ?? "Search unavailable");
        })
        .finally(() => setIsSearching(false));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, selected]);

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) {
      setSearchError("Geolocation is not supported by this browser.");
      return;
    }
    setIsSearching(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        geocodeReverse(position.coords.latitude, position.coords.longitude)
          .then((matches) => {
            if (matches[0]) {
              setSelected(matches[0]);
              setQuery(displayMatch(matches[0]));
            } else {
              setSearchError("Could not identify your location.");
            }
          })
          .catch((err: PageError) => setSearchError(err?.detail ?? "Reverse geocoding failed"))
          .finally(() => setIsSearching(false));
      },
      () => {
        setIsSearching(false);
        setSearchError("Permission denied or location unavailable.");
      },
    );
  }, []);

  const handleSearch = useCallback(() => {
    if (isDemo) {
      const demo = makeDemoLookup();
      setActiveLookupId(demo.lookup_id);
      return;
    }
    if (!sessionId || !selected) return;
    const { start, end } = clampDateRange(startDate, endDate);
    setStartDate(start);
    setEndDate(end);
    createMutation.mutate({
      session_id: sessionId,
      raw_query: query || selected.name,
      start_date: start,
      end_date: end,
      chosen_location: selected,
      notes: null,
    });
  }, [isDemo, sessionId, selected, startDate, endDate, query, createMutation]);

  const handleSelectHistory = useCallback((id: number) => {
    setActiveLookupId(id);
  }, []);

  const activeRecord: LookupRecord | null = isDemo
    ? makeDemoLookup()
    : activeLookupQuery.data ?? null; // ---------------no fallback to a history row: GET /api/lookups returns a summary without daily rows or coordinates, and the detail components require both

  const videos: VideoItem[] = isDemo
    ? [
        {
          video_id: "demo1",
          title: "Demo Walking Tour — Bronx, New York",
          channel_title: "Demo Channel",
          thumbnail_url: "https://placehold.co/320x180/3b82f6/ffffff?text=Demo+Tour",
        },
      ]
    : videosQuery.data ?? [];

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Weather Forecast
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              PM Accelerator Tech Assessment — search a place, see the forecast, watch a walking tour.
            </p>
          </div>
          {isDemo && (
            <div className="inline-flex items-center gap-2 rounded-md bg-amber/15 px-3 py-2 text-xs font-medium text-amber">
              <AlertCircle className="h-4 w-4" />
              Backend not connected — demo mode active.
            </div>
          )}
        </header>

        {pageError && pageError.detail && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {pageError.detail}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left column */}
          <section className="space-y-6 lg:col-span-4">
            <div className="board rounded-xl p-5">
              <SearchBar
                query={query}
                onQueryChange={setQuery}
                selected={selected}
                onSelect={(match) => {
                  setSelected(match);
                  if (match) setQuery(displayMatch(match));
                }}
                onGeolocate={handleGeolocate}
                suggestions={suggestions}
                isLoading={isSearching}
                error={searchError}
                disabled={createMutation.isPending}
              />

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground">Start date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background/70 px-2 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground">End date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background/70 px-2 py-2 text-sm"
                  />
                </div>
              </div>

              <button
                onClick={handleSearch}
                disabled={(!selected && !isDemo) || createMutation.isPending}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapIcon className="h-4 w-4" />
                )}
                {createMutation.isPending ? "Fetching forecast…" : "Show weather"}
              </button>
            </div>

            <LookupHistory
              lookups={historyQuery.data ?? []}
              activeId={activeLookupId}
              onSelect={handleSelectHistory}
              onDelete={(id) => deleteMutation.mutate(id)}
              onUpdate={(id, input) => updateMutation.mutate({ id, input })}
              onExport={(id) => {
                if (sessionId && sessionId !== DEMO_SESSION_ID) {
                  exportMutation.mutate({ id, sessionId });
                }
              }}
              isUpdating={updateMutation.isPending ? (updateMutation.variables?.id ?? null) : null}
              isDeleting={deleteMutation.isPending ? (deleteMutation.variables ?? null) : null}
              isExporting={
                exportMutation.isPending ? (exportMutation.variables?.id ?? null) : null
              }
            />

            <VideoDeck videos={videos} />
          </section>

          {/* Right column */}
          <section className="space-y-6 lg:col-span-8">
            {activeRecord ? (
              <>
                <CurrentWeather record={activeRecord} />
                <ForecastRow daily={activeRecord.daily} />
                <WeatherMap
                  latitude={activeRecord.latitude}
                  longitude={activeRecord.longitude}
                  locationName={activeRecord.location_name}
                />
              </>
            ) : (
              <div className="board flex min-h-[24rem] flex-col items-center justify-center rounded-xl p-8 text-center">
                <MapIcon className="h-12 w-12 text-muted-foreground/50" />
                <h2 className="mt-4 text-xl font-semibold text-foreground">No location selected</h2>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Search for a city or use your current location to see the map, current conditions,
                  5-day forecast, and walking-tour videos.
                </p>
              </div>
            )}

            <AboutSection />
          </section>
        </div>
      </div>
    </main>
  );
}

function displayMatch(match: GeocodeMatch) {
  return `${match.name}${match.state ? `, ${match.state}` : ""}, ${match.country}`;
}
