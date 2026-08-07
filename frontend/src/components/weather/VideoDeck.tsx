import { Play, ExternalLink } from "lucide-react";
import type { VideoItem } from "@/lib/weather-types";

type VideoDeckProps = {
  videos: VideoItem[];
};

export function VideoDeck({ videos }: VideoDeckProps) {
  if (videos.length === 0) {
    return (
      <div className="board rounded-xl p-5">
        <p className="text-sm text-muted-foreground">No videos found for this place.</p>
      </div>
    );
  }

  return (
    <div className="board rounded-xl p-5">
      <div className="space-y-3">
        {videos.slice(0, 3).map((video) => (
          <a
            key={video.video_id}
            href={`https://www.youtube.com/watch?v=${video.video_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex gap-3 overflow-hidden rounded-lg border border-border/60 bg-background/60 p-2 transition-colors hover:bg-background"
          >
            <div className="relative aspect-video h-24 w-40 shrink-0 overflow-hidden rounded-md">
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-foreground shadow-lg">
                  <Play className="h-3.5 w-3.5 fill-current" />
                </div>
              </div>
            </div>
            <div className="flex min-w-0 flex-col justify-center py-1">
              <h4 className="line-clamp-2 text-sm font-medium text-foreground">{video.title}</h4>
              <p className="mt-1 text-xs text-muted-foreground">{video.channel_title}</p>
              <div className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-secondary">
                Watch on YouTube <ExternalLink className="h-3 w-3" />
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
