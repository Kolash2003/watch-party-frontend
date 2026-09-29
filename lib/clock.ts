import type { AppSocket } from "./socket";

// serverNow() = Date.now() + offset, with offset taken from the lowest-RTT ping sample.
let offset = 0;
export const serverNow = () => Date.now() + offset;

export function syncClock(socket: AppSocket, samples = 5) {
  let best = Infinity;
  const onPong = ({ clientTime, serverTime }: { clientTime: number; serverTime: number }) => {
    const now = Date.now();
    const rtt = now - clientTime;
    if (rtt < best) {
      best = rtt;
      offset = serverTime - (clientTime + now) / 2;
    }
  };
  socket.on("time:pong", onPong);
  for (let i = 0; i < samples; i++) setTimeout(() => socket.emit("time:ping", { clientTime: Date.now() }), i * 100);
  setTimeout(() => socket.off("time:pong", onPong), samples * 100 + 3000);
}
