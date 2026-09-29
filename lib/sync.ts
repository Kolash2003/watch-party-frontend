export type PlaybackState = { playing: boolean; position: number; updatedAt: number };

export function expectedPosition(s: PlaybackState, now: number): number {
  return s.playing ? s.position + (now - s.updatedAt) / 1000 : s.position;
}

// drift = video.currentTime - expected (seconds). Positive means ahead.
export function driftAction(drift: number, rate: number): { seek: boolean; rate: number } {
  const abs = Math.abs(drift);
  if (abs > 1.5) return { seek: true, rate: 1 };
  if (abs >= 0.3) return { seek: false, rate: drift < 0 ? 1.05 : 0.95 };
  if (abs < 0.1) return { seek: false, rate: 1 };
  return { seek: false, rate }; // 0.1 to 0.3: keep correcting until back under 0.1, otherwise leave alone
}
