import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@shared/events";
import { API_ORIGIN } from "./api";

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// One socket per tab.
let socket: AppSocket | null = null;
export const getSocket = () => (socket ??= io(API_ORIGIN, { withCredentials: true, autoConnect: false }));
