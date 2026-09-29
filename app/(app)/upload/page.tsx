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

  const start = (resume = true) => {
    if (!file) return;
    const u = new tus.Upload(file, {
      endpoint: `${API}/uploads`,
      chunkSize: 8 * 1024 * 1024,
      retryDelays: [0, 1000, 3000, 5000, 10000],
      metadata: { filename: file.name, filetype: file.type },
      removeFingerprintOnSuccess: true,
      onBeforeRequest: (req) => { (req.getUnderlyingObject() as XMLHttpRequest).withCredentials = true; },
      onProgress: (sent, total) => setPct(Math.round((sent / total) * 100)),
      onError: (e) => { setState("idle"); toast.error(`Upload failed: ${e.message}`); },
      onSuccess: ({ lastResponse }) => {
        const id = lastResponse.getHeader("X-Video-Id");
        if (!id && resume) {
          // "Resumed" an upload the server already had in full, so it never created a video for it.
          // Throw that one away and send the file again from scratch.
          u.abort(true).catch(() => {}).then(() => start(false));
          return;
        }
        if (!id) { setState("idle"); return void toast.error("Upload finished but the server didn't register the video. Please try again."); }
        toast.success("Uploaded! Processing will start now.");
        router.push(`/videos/${id}`);
      },
    });
    upload.current = u;
    setPct(0);
    setState("uploading");
    if (!resume) return u.start();
    // resume a previous partial upload of the same file if the server remembers it
    u.findPreviousUploads().then((prev) => { if (prev[0]) u.resumeFromPreviousUpload(prev[0]); u.start(); });
  };

  const toggle = () => {
    if (state === "uploading") { upload.current?.abort(); setState("paused"); }
    else { upload.current?.start(); setState("uploading"); }
  };
  const cancel = () => { upload.current?.abort(true).catch(() => {}); upload.current = null; setFile(null); setPct(0); setState("idle"); };

  return (
    <Card className="glass enter mx-auto mt-4 max-w-xl shadow-2xl shadow-primary/10 [--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight">Upload a <span className="text-gradient">video</span></CardTitle>
        <CardDescription>Only upload videos you own or have the right to share. mp4, mkv, mov, webm up to 5 GB; large files resume if interrupted.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!file ? (
          <label
            onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
            onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files[0]); }}
            className={`group flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-12 text-center transition-all duration-300 focus-within:ring-3 focus-within:ring-ring/50 ${over ? "scale-[1.02] border-primary bg-primary/10 shadow-lg shadow-primary/20" : "hover:border-primary/50 hover:bg-muted/40"}`}
          >
            <span className={`bg-brand grid size-14 place-items-center rounded-2xl shadow-lg shadow-primary/30 transition-transform duration-300 group-hover:-translate-y-1 ${over ? "-translate-y-2 animate-bounce" : ""}`}>
              <UploadCloud className="size-7 text-white" />
            </span>
            <span className="font-medium">{over ? "Drop it!" : "Drag a video here"}</span>
            <span className="text-sm text-muted-foreground">or <span className="text-primary underline underline-offset-4">browse your files</span></span>
            <input type="file" accept="video/*,.mkv" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
          </label>
        ) : (
          <>
            <div className="flex animate-in fade-in zoom-in-95 items-center gap-3 rounded-xl bg-muted/50 p-3">
              <span className="bg-brand grid size-11 shrink-0 place-items-center rounded-lg"><FileVideo className="size-5 text-white" /></span>
              <div className="min-w-0">
                <p className="truncate font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{fmtSize(file.size)}</p>
              </div>
            </div>
            {state !== "idle" && <Progress className="animate-in fade-in" value={pct} aria-label="Upload progress"><span className="text-sm tabular-nums">{pct}%{state === "paused" && " (paused)"}</span></Progress>}
            <div className="flex gap-2">
              {state === "idle" ? (
                <Button onClick={() => start()} className="bg-brand text-white shadow-lg shadow-primary/30 transition hover:brightness-110 active:scale-95"><UploadCloud /> Start upload</Button>
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
