"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as tus from "tus-js-client";
import { FileVideo, Pause, Play, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { API } from "@/lib/api";

const MAX = 5 * 1024 ** 3;
const fmtSize = (b: number) => (b / 1024 ** 3 >= 1 ? `${(b / 1024 ** 3).toFixed(2)} GB` : `${(b / 1024 ** 2).toFixed(1)} MB`);

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [pct, setPct] = useState(0);
  const [state, setState] = useState<"idle" | "uploading" | "paused">("idle");
  const [over, setOver] = useState(false);
  const upload = useRef<tus.Upload | null>(null);

  const pick = (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("video/") && !/\.(mkv|avi|mov|m4v)$/i.test(f.name)) return toast.error("Please choose a video file");
    if (f.size > MAX) return toast.error("Files can be at most 5 GB");
    setFile(f);
  };

  const start = () => {
    if (!file) return;
    const u = new tus.Upload(file, {
      endpoint: `${API}/uploads`,
      chunkSize: 8 * 1024 * 1024,
      retryDelays: [0, 1000, 3000, 5000, 10000],
      metadata: { filename: file.name, filetype: file.type },
      onBeforeRequest: (req) => { (req.getUnderlyingObject() as XMLHttpRequest).withCredentials = true; },
      onProgress: (sent, total) => setPct(Math.round((sent / total) * 100)),
      onError: (e) => { setState("idle"); toast.error(`Upload failed: ${e.message}`); },
      onSuccess: ({ lastResponse }) => {
        const id = lastResponse.getHeader("X-Video-Id");
        toast.success("Uploaded! Processing will start now.");
        router.push(id ? `/videos/${id}` : "/");
      },
    });
    upload.current = u;
    // resume a previous partial upload of the same file if the server remembers it
    u.findPreviousUploads().then((prev) => { if (prev[0]) u.resumeFromPreviousUpload(prev[0]); u.start(); });
    setState("uploading");
  };

  const toggle = () => {
    if (state === "uploading") { upload.current?.abort(); setState("paused"); }
    else { upload.current?.start(); setState("uploading"); }
  };
  const cancel = () => { upload.current?.abort(true).catch(() => {}); upload.current = null; setFile(null); setPct(0); setState("idle"); };

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle>Upload a video</CardTitle>
        <CardDescription>Only upload videos you own or have the right to share. mp4, mkv, mov, webm up to 5 GB; large files resume if interrupted.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!file ? (
          <label
            onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
            onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files[0]); }}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition-colors focus-within:ring-3 focus-within:ring-ring/50 ${over ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
          >
            <UploadCloud className="size-8 text-muted-foreground" />
            <span className="text-sm">Drag a video here or <span className="text-primary underline">browse</span></span>
            <input type="file" accept="video/*,.mkv" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
          </label>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <FileVideo className="size-8 text-primary" />
              <div className="min-w-0">
                <p className="truncate font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{fmtSize(file.size)}</p>
              </div>
            </div>
            {state !== "idle" && <Progress value={pct} aria-label="Upload progress"><span className="text-sm tabular-nums">{pct}%{state === "paused" && " (paused)"}</span></Progress>}
            <div className="flex gap-2">
              {state === "idle" ? (
                <Button onClick={start}><UploadCloud /> Start upload</Button>
              ) : (
                <Button variant="secondary" onClick={toggle}>{state === "uploading" ? <><Pause /> Pause</> : <><Play /> Resume</>}</Button>
              )}
              <Button variant="ghost" onClick={cancel}><X /> Cancel</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
