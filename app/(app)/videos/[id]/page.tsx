"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CircleAlert, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { VideoThumb } from "@/components/video-thumb";
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

  if (error) return <Alert variant="destructive" className="mx-auto max-w-2xl"><CircleAlert /><AlertTitle>Couldn’t load video</AlertTitle><AlertDescription>{error.message}</AlertDescription></Alert>;
  if (!v) return <Skeleton className="shimmer mx-auto aspect-video max-w-2xl rounded-2xl" />;

  return (
    <Card className="glass enter mx-auto max-w-2xl pt-0 shadow-2xl shadow-primary/10 [--card-spacing:--spacing(6)]">
      <div className="relative aspect-video overflow-hidden">
        <VideoThumb video={v} />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
      </div>
      <CardHeader className="-mt-16 relative">
        <CardTitle className="text-2xl font-bold tracking-tight">{v.title}</CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-2">
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
        {v.status === "FAILED" && <Alert variant="destructive"><CircleAlert /><AlertTitle>Processing failed</AlertTitle><AlertDescription>{v.errorMessage ?? "Try uploading the video again."}</AlertDescription></Alert>}
        {v.status === "READY" && (
          <>
            <FieldLabel htmlFor="everyone">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Shared remote</FieldTitle>
                  <FieldDescription>Let everyone in the room play, pause and seek.</FieldDescription>
                </FieldContent>
                <Switch id="everyone" checked={everyone} onCheckedChange={setEveryone} />
              </Field>
            </FieldLabel>
            <Button size="lg" onClick={() => start.mutate()} disabled={start.isPending} className="bg-brand group h-11 text-base text-white shadow-lg shadow-primary/30 transition hover:shadow-primary/50 hover:brightness-110 active:scale-[0.98]">
              {start.isPending ? <Spinner /> : <PartyPopper className="transition-transform group-hover:scale-125 group-hover:-rotate-12" />} Start a party
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
