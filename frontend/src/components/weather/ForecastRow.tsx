import { Cloud, CloudRain, Sun, CloudLightning, Snowflake } from "lucide-react";
import type { DailyRow } from "@/lib/weather-types";
import { formatDay, formatShortDate, roundTemp, weatherLabel } from "@/lib/weather-utils";

type ForecastRowProps = {
  daily: DailyRow[];
};

export function ForecastRow({ daily }: ForecastRowProps) {
  return (
    <div className="board rounded-xl p-5">
      <h3 className="text-lg font-semibold tracking-tight text-foreground">5-Day Forecast</h3>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {daily.slice(0, 5).map((day) => (
          <DayCard key={day.date} day={day} />
        ))}
      </div>
    </div>
  );
}

function DayCard({ day }: { day: DailyRow }) {
  const Icon = weatherIconFor(day.condition);
  return (
    <div className="flex flex-col items-center rounded-lg border border-border/60 bg-background/60 p-4 text-center transition-colors hover:bg-background">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {formatDay(day.date)}
      </div>
      <div className="text-xs text-muted-foreground">{formatShortDate(day.date)}</div>
      <div className="my-3 text-steel">
        <Icon className="h-8 w-8" />
      </div>
      <div className="text-sm font-medium text-foreground">{weatherLabel(day.condition)}</div>
      <div className="mt-1 flex items-center gap-2 text-sm">
        <span className="font-semibold text-foreground">{roundTemp(day.temp_max)}°</span>
        <span className="text-muted-foreground">{roundTemp(day.temp_min)}°</span>
      </div>
    </div>
  );
}

function weatherIconFor(condition: string) {
  const c = condition.toLowerCase();
  if (c.includes("rain") || c.includes("drizzle")) return CloudRain;
  if (c.includes("snow") || c.includes("ice") || c.includes("sleet")) return Snowflake;
  if (c.includes("thunder") || c.includes("storm")) return CloudLightning;
  if (c.includes("cloud") || c.includes("overcast") || c.includes("fog") || c.includes("mist")) return Cloud;
  return Sun;
}
