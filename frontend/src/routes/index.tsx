import { createFileRoute } from "@tanstack/react-router";
import { WeatherPage } from "@/components/weather/WeatherPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Weather Forecast — PM Accelerator" },
      { name: "description", content: "Search locations, view current conditions, and browse a 5-day forecast with walking-tour videos. PM Accelerator tech assessment." },
      { property: "og:title", content: "Weather Forecast — PM Accelerator" },
      { property: "og:description", content: "Search locations, view current conditions, and browse a 5-day forecast with walking-tour videos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WeatherPage,
});
