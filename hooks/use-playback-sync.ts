"use client";

import { RefObject, useCallback, useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import { serverNow } from "@/lib/clock";
import { driftAction, expectedPosition } from "@/lib/sync";
import { useRoomStore } from "@/lib/room-store";

const expected = () => expectedPosition(useRoomStore.getState().playback, serverNow());

/**
 * Server is the single source of truth: local controls only *emit*, and every change
 * (including our own) arrives as playback:update and is applied to the <video>. Because the
 * <video> element's own play/pause/seeked events are never re-emitted, there is no echo loop.
 */
export function usePlaybackSync(videoRef: RefObject<HTMLVideoElement | null>, ready: boolean) {
  const playback = useRoomStore((s) => s.playback);
  const joined = useRoomStore((s) => s.joined);
  const [drift, setDrift] = useState(0);
  const active = ready && joined; // `ready` = user has clicked "join the party" (autoplay gesture)

  // Apply authoritative state.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !active) return;
    const exp = expected();
    if (playback.playing) {
      if (Math.abs(v.currentTime - exp) > 0.3) v.currentTime = exp;
      if (v.paused) v.play().catch(() => {});
    } else {
      v.pause();
      if (Math.abs(v.currentTime - playback.position) > 0.05) v.currentTime = playback.position;
    }
  }, [playback, active, videoRef]);

  // Drift correction, once a second while playing.
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      const v = videoRef.current;
      const s = useRoomStore.getState().playback;
      if (!v || !s.playing || v.paused) return;
      const d = v.currentTime - expected();
      setDrift(d);
      const a = driftAction(d, v.playbackRate);
      if (a.seek) v.currentTime = expected();
      v.playbackRate = a.rate;
    }, 1000);
    return () => clearInterval(id);
  }, [active, videoRef]);

  // Buffering reports (only after joining, so initial load never pauses the room).
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !active) return;
    const socket = getSocket();
    const report = (isBuffering: boolean) => () => socket.emit("playback:buffering", { isBuffering });
    const wait = report(true), done = report(false);
    v.addEventListener("waiting", wait);
    v.addEventListener("playing", done);
    v.addEventListener("canplay", done);
    return () => {
      v.removeEventListener("waiting", wait);
      v.removeEventListener("playing", done);
      v.removeEventListener("canplay", done);
    };
  }, [active, videoRef]);

  const pos = () => videoRef.current?.currentTime ?? 0;
  // Optimistic: apply locally right away so rapid skips stack; the server's playback:update reconciles.
  const seek = useCallback((position: number) => {
    const end = videoRef.current?.duration;
    position = Math.max(0, Number.isFinite(end) ? Math.min(position, end!) : position);
    useRoomStore.setState((s) => ({ playback: { ...s.playback, position, updatedAt: serverNow() } }));
    getSocket().emit("playback:seek", { position });
  }, [videoRef]);
  return {
    drift: playback.playing ? drift : 0,
    play: useCallback(() => getSocket().emit("playback:play", { position: pos() }), []), // eslint-disable-line react-hooks/exhaustive-deps
    pause: useCallback(() => getSocket().emit("playback:pause", { position: pos() }), []), // eslint-disable-line react-hooks/exhaustive-deps
    seek,
    skip: useCallback((d: number) => seek(expected() + d), [seek]),
  };
}
