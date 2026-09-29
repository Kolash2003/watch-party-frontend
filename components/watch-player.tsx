"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Captions, Check, Loader2, Maximize, Pause, Play, Settings, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { API } from "@/lib/api";
import { useRoomStore } from "@/lib/room-store";
import { usePlaybackSync } from "@/hooks/use-playback-sync";
import { fmtTime } from "@/lib/format";

type Props = { videoId: string; hasSubtitles: boolean; canControl: boolean; hostName?: string };

export function WatchPlayer({ videoId, hasSubtitles, canControl, hostName }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [gestured, setGestured] = useState(false);
  const [levels, setLevels] = useState<string[]>([]);
  const [level, setLevel] = useState(-1); // -1 = auto
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scrub, setScrub] = useState<number | null>(null);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [captions, setCaptions] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const playing = useRoomStore((s) => s.playback.playing);
  const waitingFor = useRoomStore((s) => s.waitingFor);
  const { drift, play, pause, seek } = usePlaybackSync(videoRef, gestured);

  // Load the manifest: native HLS on Safari, hls.js elsewhere.
  useEffect(() => {
    const v = videoRef.current!;
    const src = `${API}/media/${videoId}/master.m3u8`;
    if (Hls.isSupported()) {
      const hls = new Hls({ xhrSetup: (xhr) => { xhr.withCredentials = true; } });
      hlsRef.current = hls;
      hls.on(Hls.Events.MANIFEST_PARSED, (_, d) => setLevels(d.levels.map((l) => `${l.height}p`)));
      hls.loadSource(src);
      hls.attachMedia(v);
      return () => hls.destroy();
    }
    if (v.canPlayType("application/vnd.apple.mpegurl")) v.src = src;
  }, [videoId]);

  const toggle = () => canControl && (playing ? pause() : play());
  const skip = (d: number) => canControl && seek((videoRef.current?.currentTime ?? 0) + d);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!gestured || (e.target as HTMLElement).closest("input, textarea, [role=slider]")) return;
      const v = videoRef.current!;
      if (e.key === " ") { e.preventDefault(); toggle(); }
      else if (e.key === "ArrowLeft") skip(-5);
      else if (e.key === "ArrowRight") skip(5);
      else if (e.key === "f") document.fullscreenElement ? document.exitFullscreen() : boxRef.current?.requestFullscreen();
      else if (e.key === "m") setMuted((m) => !(v.muted = !m));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const join = async () => {
    const v = videoRef.current!;
    // Play+pause inside the click satisfies the autoplay policy; sync then takes over.
    await v.play().catch(() => {});
    v.pause();
    setGestured(true);
  };

  const pickLevel = (i: number) => { if (hlsRef.current) hlsRef.current.currentLevel = i; setLevel(i); };
  const toggleCaptions = () => {
    const track = videoRef.current?.textTracks[0];
    if (track) setTrackMode(track, captions ? "hidden" : "showing");
    setCaptions(!captions);
  };

  return (
    <div ref={boxRef} className="group relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      <video
        ref={videoRef}
        className="size-full"
        playsInline
        crossOrigin="use-credentials"
        onClick={toggle}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
        onCanPlay={() => setBuffering(false)}
      >
        {hasSubtitles && <track kind="subtitles" src={`${API}/media/${videoId}/subtitles.vtt`} srcLang="en" label="Subtitles" />}
      </video>

      <FloatingReactions />

      {gestured && buffering && !waitingFor && <Loader2 className="absolute top-1/2 left-1/2 size-10 -translate-x-1/2 -translate-y-1/2 animate-spin text-white/80" aria-label="Buffering" />}
      {waitingFor && <div role="status" className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-1.5 text-sm text-white">Waiting for {waitingFor} to buffer…</div>}
      {gestured && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white" title={`drift ${drift.toFixed(2)}s`}>
          <span className={`size-2 rounded-full ${Math.abs(drift) < 0.5 ? "bg-emerald-400" : "bg-amber-400"}`} />
          {hostName ? `Synced with ${hostName}` : "Synced"}
        </div>
      )}

      {!gestured && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <Button size="lg" className="h-11 px-6 text-base" onClick={join}>
            <Play /> Click to join the party
          </Button>
        </div>
      )}

      {gestured && (
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/80 to-transparent p-3 text-white opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
          <Slider
            aria-label="Seek"
            disabled={!canControl || !duration}
            min={0}
            max={duration || 1}
            step={0.5}
            value={[scrub ?? time]}
            onValueChange={(v) => setScrub(Array.isArray(v) ? v[0] : v)}
            onValueCommitted={(v) => { seek(Array.isArray(v) ? v[0] : v); setScrub(null); }}
          />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label={playing ? "Pause" : "Play"} disabled={!canControl} onClick={toggle} className="hover:bg-white/20">
              {playing ? <Pause /> : <Play />}
            </Button>
            <Button variant="ghost" size="icon" aria-label={muted ? "Unmute" : "Mute"} className="hover:bg-white/20" onClick={() => { const m = !muted; videoRef.current!.muted = m; setMuted(m); }}>
              {muted || volume === 0 ? <VolumeX /> : <Volume2 />}
            </Button>
            <div className="w-20 shrink-0"><Slider aria-label="Volume" min={0} max={1} step={0.05} value={[muted ? 0 : volume]}
              onValueChange={(v) => { const n = Array.isArray(v) ? v[0] : v; videoRef.current!.volume = n; videoRef.current!.muted = false; setVolume(n); setMuted(false); }} /></div>
            <span className="font-mono text-xs whitespace-nowrap tabular-nums">{fmtTime(scrub ?? time)} / {fmtTime(duration)}</span>
            {!canControl && <span className="ml-2 text-xs text-white/70">Only the host controls playback</span>}
            <div className="ml-auto flex items-center gap-1">
              {hasSubtitles && (
                <Button variant="ghost" size="icon" aria-label="Toggle subtitles" aria-pressed={captions} onClick={toggleCaptions} className={`hover:bg-white/20 ${captions ? "text-primary" : ""}`}><Captions /></Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="Quality" className="hover:bg-white/20" />}><Settings /></DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="top">
                  {[{ label: "Auto", i: -1 }, ...levels.map((label, i) => ({ label, i })).reverse()].map(({ label, i }) => (
                    <DropdownMenuItem key={i} onClick={() => pickLevel(i)}>
                      {label} {level === i && <Check className="ml-auto" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" aria-label="Fullscreen" className="hover:bg-white/20" onClick={() => boxRef.current?.requestFullscreen()}><Maximize /></Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const setTrackMode = (t: TextTrack, mode: TextTrackMode) => { t.mode = mode; };

function FloatingReactions() {
  const reactions = useRoomStore((s) => s.reactions);
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-16 h-48" aria-hidden>
      {reactions.map((r) => (
        <span key={r.id} className="reaction-float absolute bottom-0 text-3xl" style={{ left: `${r.x}%` }} title={r.name}>{r.emoji}</span>
      ))}
    </div>
  );
}
