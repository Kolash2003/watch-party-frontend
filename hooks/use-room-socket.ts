"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";
import { syncClock } from "@/lib/clock";
import { roomActions, useRoomStore } from "@/lib/room-store";

// Connects the tab's socket, joins the room, and pipes server events into the zustand store.
export function useRoomSocket(code: string, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const socket = getSocket();
    const store = useRoomStore.getState();
    store.reset();

    socket.on("connect", () => {
      useRoomStore.getState().setConnected(true);
      syncClock(socket);
      socket.emit("room:join", { code }); // also runs on reconnect; server replies with a fresh room:state
    });
    socket.on("disconnect", () => useRoomStore.getState().setConnected(false));
    socket.on("connect_error", (e) => toast.error(e.message === "unauthorized" ? "Please sign in again" : "Connection problem"));
    socket.on("room:state", (s) => useRoomStore.getState().setRoom(s));
    socket.on("playback:update", (u) => useRoomStore.getState().setPlayback(u));
    socket.on("member:joined", ({ user }) => roomActions.addMember(user));
    socket.on("member:left", ({ user }) => roomActions.removeMember(user.id));
    socket.on("member:buffering", ({ userId, buffering }) => roomActions.setBuffering(userId, buffering));
    socket.on("host:changed", ({ hostId }) => roomActions.setHost(hostId));
    socket.on("chat:message", roomActions.addChat);
    socket.on("reaction", ({ user, emoji }) => roomActions.addReaction(emoji, user.name));
    socket.on("error", ({ code: c, message }) => (c === "ROOM_CLOSED" ? roomActions.close() : toast.error(message)));

    socket.connect();
    const clockTimer = setInterval(() => socket.connected && syncClock(socket), 30_000);

    return () => {
      clearInterval(clockTimer);
      socket.emit("room:leave", {});
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [code, enabled]);
}
