import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Search, Loader2, X } from "lucide-react";
import type { GeocodeMatch } from "@/lib/weather-types";

const DEBOUNCE_MS = 350;

type SearchBarProps = {
  query: string;
  onQueryChange: (q: string) => void;
  selected: GeocodeMatch | null;
  onSelect: (m: GeocodeMatch | null) => void;
  onGeolocate: () => void;
  suggestions: GeocodeMatch[];
  isLoading: boolean;
  error: string | null;
  disabled?: boolean;
};

export function SearchBar({
  query,
  onQueryChange,
  selected,
  onSelect,
  onGeolocate,
  suggestions,
  isLoading,
  error,
  disabled,
}: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (suggestions.length > 0 && query.trim().length > 0) {
      setIsOpen(true);
      setActiveIndex(-1);
    } else {
      setIsOpen(false);
    }
  }, [suggestions, query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        const match = suggestions[activeIndex];
        if (match) {
          onSelect(match);
          setIsOpen(false);
        }
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    },
    [isOpen, suggestions, activeIndex, onSelect],
  );

  function handleSelect(match: GeocodeMatch) {
    onSelect(match);
    setIsOpen(false);
  }

  function clearSelection() {
    onSelect(null);
    onQueryChange("");
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="board rounded-lg p-1.5 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={selected ? displayMatch(selected) : query}
            onChange={(e) => {
              if (selected) {
                onSelect(null);
              }
              onQueryChange(e.target.value);
            }}
            onFocus={() => {
              if (suggestions.length > 0 && query.trim().length > 0) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Search city or place…"
            className="w-full rounded-md border border-input bg-background/70 px-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {!isLoading && selected && (
            <button
              onClick={clearSelection}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear selection"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          onClick={onGeolocate}
          disabled={disabled}
          className="inline-flex shrink-0 items-center justify-center rounded-md bg-secondary px-3 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/90 disabled:opacity-50"
          aria-label="Use my current location"
        >
          <MapPin className="h-4 w-4" />
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-2 w-full rounded-lg border border-border bg-board shadow-lg overflow-hidden">
          {suggestions.map((match, index) => (
            <li key={`${match.latitude}-${match.longitude}-${index}`}>
              <button
                onClick={() => handleSelect(match)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                  index === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                }`}
              >
                <span className="font-medium">{match.name}</span>
                <span className="ml-2 text-muted-foreground">
                  {formatLocationMeta(match)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function displayMatch(match: GeocodeMatch) {
  return `${match.name}${match.state ? `, ${match.state}` : ""}, ${match.country}`;
}

function formatLocationMeta(match: GeocodeMatch) {
  const parts = [match.state, match.country].filter(Boolean);
  return parts.join(", ");
}
