"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MoreVertical, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { api, Video } from "@/lib/api";
import { fmtTime } from "@/lib/format";

const STATUS = { QUEUED: "Queued", PROCESSING: "Processing", READY: "Ready", FAILED: "Failed" } as const;

export default function Dashboard() {
  const qc = useQueryClient();
  const [deleting, setDeleting] = useState<Video | null>(null);
  const videos = useQuery({
    queryKey: ["videos"],
    queryFn: () => api<Video[]>("/videos"),
    refetchInterval: (q) => (q.state.data?.some((v) => v.status === "QUEUED" || v.status === "PROCESSING") ? 3000 : false),
  });
  const rooms = useQuery({ queryKey: ["rooms"], queryFn: () => api<{ code: string; videoTitle: string }[]>("/rooms/mine") });
  const del = useMutation({
    mutationFn: (id: string) => api(`/videos/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["videos"] }); qc.invalidateQueries({ queryKey: ["rooms"] }); toast.success("Video deleted"); },
  });

  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">My videos</h1>
          <Link href="/upload" className={buttonVariants()}><Upload /> Upload</Link>
        </div>
        {videos.isLoading && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-32" />)}</div>}
        {videos.data?.length === 0 && <p className="text-muted-foreground">No videos yet. Upload one to start a party.</p>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.data?.map((v) => (
            <Card key={v.id} className="relative">
              <CardHeader>
                <CardTitle className="truncate pr-8"><Link href={`/videos/${v.id}`} className="after:absolute after:inset-0">{v.title}</Link></CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant={v.status === "FAILED" ? "destructive" : v.status === "READY" ? "default" : "secondary"}>{STATUS[v.status]}</Badge>
                  {v.durationSec && <span className="font-mono text-xs text-muted-foreground">{fmtTime(v.durationSec)}</span>}
                </div>
                {(v.status === "PROCESSING" || v.status === "QUEUED") && <Progress value={v.progress} aria-label="Processing progress" />}
                {v.errorMessage && <p className="text-xs text-destructive">{v.errorMessage}</p>}
              </CardContent>
              <div className="absolute top-2 right-2 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Video actions" />}><MoreVertical /></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setDeleting(v)}><Trash2 /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">My open rooms</h2>
        {rooms.data?.length === 0 && <p className="text-muted-foreground">No open rooms.</p>}
        <div className="flex flex-wrap gap-3">
          {rooms.data?.map((r) => (
            <Link key={r.code} href={`/rooms/${r.code}`} className={buttonVariants({ variant: "outline" })}>
              {r.videoTitle} <span className="font-mono text-muted-foreground">{r.code}</span>
            </Link>
          ))}
        </div>
      </section>
      <ConfirmDialog
        open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this video?" description="The video, its processed files and any rooms using it will be removed." confirmLabel="Delete"
        onConfirm={() => { if (deleting) del.mutate(deleting.id); }}
      />
    </div>
  );
}
