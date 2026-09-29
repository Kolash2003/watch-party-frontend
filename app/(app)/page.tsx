"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Film, LogIn, MoreVertical, Play, Radio, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { VideoThumb } from "@/components/video-thumb";
import { api, Video } from "@/lib/api";
import { fmtTime } from "@/lib/format";

const STATUS = { QUEUED: "Queued", PROCESSING: "Processing", READY: "Ready", FAILED: "Failed" } as const;

export default function Dashboard() {
  const qc = useQueryClient();
  const router = useRouter();
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
    <div className="flex flex-col gap-10">
      <section className="glass enter relative overflow-hidden rounded-2xl p-6 sm:p-8">
        <div className="bg-brand animate-blob pointer-events-none absolute -top-16 -right-10 size-64 rounded-full opacity-25 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your <span className="text-gradient">watch parties</span></h1>
            <p className="mt-2 max-w-md text-muted-foreground">Upload a video, start a room, and watch in perfect sync with friends.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <form className="flex gap-2" onSubmit={(e) => {
              e.preventDefault();
              // Accept a bare code or a pasted invite link.
              const code = String(new FormData(e.currentTarget).get("code")).trim().split("/").pop()?.toLowerCase();
              if (code) router.push(`/join/${code}`);
            }}>
              <Input name="code" placeholder="Room code" aria-label="Room code" required className="h-10 w-36 font-mono" />
              <Button type="submit" variant="outline" size="lg" className="h-10"><LogIn /> Join</Button>
            </form>
            <Link href="/upload" className={buttonVariants({ size: "lg", className: "bg-brand h-10 px-5 text-white shadow-lg shadow-primary/30 transition hover:scale-105 hover:shadow-primary/50" })}>
              <Upload /> Upload video
            </Link>
          </div>
        </div>
      </section>

      {rooms.data && rooms.data.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Radio className="size-5 text-[var(--brand-2)]" /> Live rooms</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.data.map((r, i) => (
              <Link key={r.code} href={`/rooms/${r.code}`} style={{ "--i": i } as React.CSSProperties}
                className="glass enter lift group flex items-center gap-3 rounded-xl p-4 hover:border-primary/50">
                <span className="relative flex size-2.5">
                  <span className="animate-ping-soft absolute inline-flex size-full rounded-full bg-emerald-400" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">{r.videoTitle}</span>
                <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">{r.code}</span>
                <Play className="size-4 text-primary transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Film className="size-5 text-primary" /> My videos</h2>
        {videos.isLoading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="shimmer aspect-video rounded-xl" />)}
          </div>
        )}
        {videos.data?.length === 0 && (
          <Empty className="enter border-2 py-16">
            <EmptyHeader>
              <EmptyMedia className="bg-brand size-16 rounded-2xl text-white shadow-lg shadow-primary/30"><Film className="size-8" /></EmptyMedia>
              <EmptyTitle>No videos yet</EmptyTitle>
              <EmptyDescription>Upload one to start your first party.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent><Link href="/upload" className={buttonVariants({ variant: "outline" })}><Upload /> Upload</Link></EmptyContent>
          </Empty>
        )}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {videos.data?.map((v, i) => (
            <div key={v.id} style={{ "--i": i } as React.CSSProperties} className="glass enter lift group relative overflow-hidden rounded-xl hover:border-primary/40">
              <div className="relative aspect-video overflow-hidden bg-muted">
                <VideoThumb video={v} className="transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                {v.status === "READY" && (
                  <div className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="bg-brand grid size-12 scale-75 place-items-center rounded-full shadow-xl transition-transform duration-300 group-hover:scale-100">
                      <Play className="ml-0.5 size-5 fill-white text-white" />
                    </span>
                  </div>
                )}
                {v.durationSec && <span className="absolute right-2 bottom-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-xs text-white">{fmtTime(v.durationSec)}</span>}
                <Badge className="absolute bottom-2 left-2" variant={v.status === "FAILED" ? "destructive" : v.status === "READY" ? "default" : "secondary"}>{STATUS[v.status]}</Badge>
              </div>
              <div className="flex flex-col gap-2 p-4">
                <Link href={`/videos/${v.id}`} className="truncate pr-8 font-medium after:absolute after:inset-0">{v.title}</Link>
                {(v.status === "PROCESSING" || v.status === "QUEUED") && <Progress value={v.progress} aria-label="Processing progress" />}
                {v.errorMessage && <p className="text-xs text-destructive">{v.errorMessage}</p>}
              </div>
              <div className="absolute right-2 bottom-3 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Video actions" />}><MoreVertical /></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem variant="destructive" onClick={() => setDeleting(v)}><Trash2 /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
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
