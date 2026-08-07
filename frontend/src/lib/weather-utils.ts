import { format, parseISO } from "date-fns";

export function formatDate(isoDate: string) {
  return format(parseISO(isoDate), "EEE, MMM d");
}

export function formatShortDate(isoDate: string) {
  return format(parseISO(isoDate), "MMM d");
}

export function formatDay(isoDate: string) {
  return format(parseISO(isoDate), "EEE");
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function offsetDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function clampDateRange(start: string, end: string) {
  const min = "1940-01-01";
  const max = offsetDate(16);
  return {
    start: start < min ? min : start,
    end: end > max ? max : end,
  };
}

export function weatherLabel(condition: string | null) {
  if (!condition) return "Unknown";
  return condition.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function celsiusToF(c: number) {
  return Math.round((c * 9) / 5 + 32);
}

export function roundTemp(c: number) {
  return Math.round(c);
}

export function openWeatherIconUrl(code: string, size: "2x" | "4x" = "2x") {
  return `https://openweathermap.org/img/wn/${code}${size === "4x" ? "@4x" : "@2x"}.png`;
}

export function makeDemoLookup() {
  const start = todayIso();
  const end = offsetDate(4);
  return {
    lookup_id: 0,
    session_id: 0,
    location_name: "Bronx",
    state: "New York",
    country: "US",
    latitude: 40.8467,
    longitude: -73.8786,
    start_date: start,
    end_date: end,
    notes: "Demo data — backend not connected.",
    current_temp: 24,
    current_condition: "scattered clouds",
    current_icon: "03d",
    observed_at: new Date().toISOString(),
    daily: Array.from({ length: 5 }).map((_, i) => {
      const date = offsetDate(i);
      const base = 22 + Math.sin(i) * 4;
      return {
        date,
        temp_min: base - 6,
        temp_max: base + 4,
        temp_mean: base,
        condition: i % 3 === 0 ? "partly cloudy" : i % 3 === 1 ? "light rain" : "clear sky",
        precipitation_sum: i % 3 === 1 ? 2.4 : 0,
        wind_speed_max: 12 + i * 2,
        source: "Open-Meteo demo",
        fetched_at: new Date().toISOString(),
      };
    }),
  };
}
