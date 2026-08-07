import { Cloud, Droplets, Wind, Thermometer } from "lucide-react";
import type { LookupRecord } from "@/lib/weather-types";
import { openWeatherIconUrl, weatherLabel, roundTemp } from "@/lib/weather-utils";

type CurrentWeatherProps = {
  record: LookupRecord;
};

export function CurrentWeather({ record }: CurrentWeatherProps) {
  const fallback = record.daily[0];
  const temp = record.current_temp ?? fallback?.temp_mean ?? null;
  const condition = record.current_condition ?? fallback?.condition ?? null;
  const icon = record.current_icon;
  const location = [record.location_name, record.state, record.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="board rounded-xl p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">{location}</h2>
          <p className="text-sm text-muted-foreground">
            {record.start_date} → {record.end_date}
          </p>
          {record.notes && <p className="mt-2 text-sm text-foreground/80">{record.notes}</p>}
        </div>

        <div className="flex items-center gap-4">
          {icon ? (
            <img
              src={openWeatherIconUrl(icon, "4x")}
              alt={weatherLabel(condition)}
              className="h-20 w-20"
            />
          ) : (
            <Cloud className="h-20 w-20 text-steel" />
          )}
          <div>
            <div className="text-5xl font-bold tracking-tighter text-foreground">
              {temp !== null ? `${roundTemp(temp)}°` : "—"}
            </div>
            <div className="text-sm font-medium text-muted-foreground">
              {weatherLabel(condition)}
            </div>
          </div>
        </div>
      </div>

      {fallback && (
        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border/60 pt-5">
          <MiniStat
            icon={<Thermometer className="h-4 w-4" />}
            label="Avg"
            value={`${roundTemp(fallback.temp_mean)}°`}
          />
          <MiniStat
            icon={<Droplets className="h-4 w-4" />}
            label="Rain"
            value={`${fallback.precipitation_sum} mm`}
          />
          <MiniStat
            icon={<Wind className="h-4 w-4" />}
            label="Wind"
            value={`${fallback.wind_speed_max} km/h`}
          />
        </div>
      )}
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary/20 text-secondary">
        {icon}
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold text-foreground">{value}</div>
      </div>
    </div>
  );
}
