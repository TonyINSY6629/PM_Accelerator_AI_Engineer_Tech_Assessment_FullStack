import { ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy, useMemo } from "react";

const LazyMap = lazy(() => import("./WeatherMapInner"));

type WeatherMapProps = {
  latitude: number;
  longitude: number;
  locationName: string;
};

export function WeatherMap({ latitude, longitude, locationName }: WeatherMapProps) {
  const key = useMemo(() => `${latitude}-${longitude}`, [latitude, longitude]);
  return (
    <ClientOnly fallback={<MapSkeleton />}>
      <Suspense fallback={<MapSkeleton />}>
        <LazyMap key={key} latitude={latitude} longitude={longitude} locationName={locationName} />
      </Suspense>
    </ClientOnly>
  );
}

function MapSkeleton() {
  return (
    <div className="flex h-full min-h-[16rem] w-full items-center justify-center rounded-lg bg-muted animate-pulse">
      <span className="text-sm text-muted-foreground">Loading map…</span>
    </div>
  );
}
