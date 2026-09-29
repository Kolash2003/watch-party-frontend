"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { api, Video } from "@/lib/api";
import { fmtTime } from "@/lib/format";

export default function VideoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [everyone, setEveryone] = useState(false);
  const { data: v, error } = useQuery({
    queryKey: ["video", id],
    queryFn: () => api<Video>(`/videos/${id}`),
    refetchInterval: (q) => (q.state.data && (q.state.data.status === "QUEUED" || q.state.data.status === "PROCESSING") ? 3000 : false),
  });
  const start = useMutation({
    mutationFn: () => api<{ code: string }>("/rooms", { method: "POST", json: { videoId: id, controlMode: everyone ? "EVERYONE" : "HOST_ONLY" } }),
    onSuccess: ({ code }) => router.push(`/rooms/${code}`),
    onError: (e) => toast.error(e.message),
  });

  if (error) return <p className="text-destructive">{error.message}</p>;
  if (!v) return <Skeleton className="h-48 max-w-xl" />;

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>{v.title}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Badge variant={v.status === "FAILED" ? "destructive" : v.status === "READY" ? "default" : "secondary"}>{v.status.toLowerCase()}</Badge>
          {v.durationSec && <span className="font-mono">{fmtTime(v.durationSec)}</span>}
          {v.height && <span>{v.height}p source</span>}
          {v.renditions.length > 0 && <span>· {v.renditions.join(", ")}</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {(v.status === "QUEUED" || v.status === "PROCESSING") && (
          <Progress value={v.progress} aria-label="Processing progress"><span className="text-sm">{v.status === "QUEUED" ? "Waiting in queue…" : `Processing ${v.progress}%`}</span></Progress>
        )}
        {v.status === "FAILED" && <p className="text-sm text-destructive">{v.errorMessage ?? "Processing failed"}</p>}
        {v.status === "READY" && (
          <>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={everyone} onChange={(e) => setEveryone(e.target.checked)} className="size-4 accent-primary" />
              Let everyone control playback
            </label>
            <Button onClick={() => start.mutate()} disabled={start.isPending}><PartyPopper /> Start a room</Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
