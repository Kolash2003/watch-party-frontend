"use client";

import { useState } from "react";
import { Film } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { API, Video } from "@/lib/api";

// thumb.jpg is written by the worker once processing starts; fall back to an icon until then.
export function VideoThumb({ video, className = "" }: { video: Pick<Video, "id" | "status">; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (video.status !== "READY" || failed) return (
    <div className="grid size-full place-items-center bg-gradient-to-br from-primary/25 via-muted to-[var(--brand-2)]/20">
      {video.status === "READY" || video.status === "FAILED"
        ? <Film className="size-10 text-muted-foreground" />
        : <Spinner className="size-8 text-primary" />}
    </div>
  );
  // eslint-disable-next-line @next/next/no-img-element -- auth-cookie media route, not optimizable by next/image
  return <img src={`${API}/media/${video.id}/thumb.jpg`} alt="" loading="lazy" onError={() => setFailed(true)} className={`size-full object-cover ${className}`} />;
}
