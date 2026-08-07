export type GeocodeMatch = {
  name: string;
  state: string | null;
  country: string;
  latitude: number;
  longitude: number;
};

export type CurrentWeather = {
  current_temp: number;
  current_condition: string;
  current_icon: string;
  observed_at: string;
};

export type DailyRow = {
  date: string;
  temp_min: number;
  temp_max: number;
  temp_mean: number;
  condition: string;
  precipitation_sum: number;
  wind_speed_max: number;
  source: string;
  fetched_at: string;
};

export type LookupRecord = {
  lookup_id: number;
  session_id: number;
  location_name: string;
  state: string | null;
  country: string;
  latitude: number;
  longitude: number;
  start_date: string;
  end_date: string;
  notes: string | null;
  current_temp: number | null;
  current_condition: string | null;
  current_icon: string | null;
  observed_at: string | null;
  daily: DailyRow[];
};

export type VideoItem = {
  video_id: string;
  title: string;
  channel_title: string;
  thumbnail_url: string;
};

export type ApiError = {
  status: number;
  detail: string;
};
