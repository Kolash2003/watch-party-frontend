import { create } from "zustand";
import type { ChatMessage, Member, PlaybackUpdate, RoomState } from "@shared/events";

type Reaction = { id: number; emoji: string; name: string; x: number };

type RoomStore = {
  connected: boolean;
  joined: boolean;
  hostId: string | null;
  controlMode: RoomState["controlMode"];
  members: Member[];
  chat: ChatMessage[];
  // position is as of updatedAt on the *server* clock
  playback: { playing: boolean; position: number; updatedAt: number };
  waitingFor: string | null;
  reactions: Reaction[];
  closed: boolean;
  setConnected: (c: boolean) => void;
  setRoom: (s: RoomState) => void;
  setPlayback: (u: PlaybackUpdate) => void;
  reset: () => void;
};

const initial = {
  connected: false, joined: false, hostId: null as string | null, controlMode: "HOST_ONLY" as const,
  members: [] as Member[], chat: [] as ChatMessage[], playback: { playing: false, position: 0, updatedAt: 0 },
  waitingFor: null as string | null, reactions: [] as Reaction[], closed: false,
};

let reactionId = 0;

export const useRoomStore = create<RoomStore>((set) => ({
  ...initial,
  setConnected: (connected) => set({ connected }),
  setRoom: (s) => set({
    joined: true, hostId: s.hostId, controlMode: s.controlMode, members: s.members, chat: s.chat,
    playback: { playing: s.playback.playing, position: s.playback.position, updatedAt: s.playback.serverTime },
  }),
  setPlayback: (u) => set({ playback: { playing: u.playing, position: u.position, updatedAt: u.serverTime }, waitingFor: u.waitingFor ?? null }),
  reset: () => set({ ...initial }),
}));

export const roomActions = {
  addMember: (m: Member) => useRoomStore.setState((s) => ({ members: s.members.some((x) => x.id === m.id) ? s.members : [...s.members, m] })),
  removeMember: (id: string) => useRoomStore.setState((s) => ({ members: s.members.filter((x) => x.id !== id) })),
  setBuffering: (id: string, buffering: boolean) => useRoomStore.setState((s) => ({ members: s.members.map((m) => (m.id === id ? { ...m, buffering } : m)) })),
  setHost: (hostId: string) => useRoomStore.setState({ hostId }),
  addChat: (m: ChatMessage) => useRoomStore.setState((s) => ({ chat: [...s.chat.slice(-199), m] })),
  addReaction: (emoji: string, name: string) => {
    const r = { id: ++reactionId, emoji, name, x: 10 + Math.random() * 80 };
    useRoomStore.setState((s) => ({ reactions: [...s.reactions, r] }));
    setTimeout(() => useRoomStore.setState((s) => ({ reactions: s.reactions.filter((x) => x.id !== r.id) })), 2000);
  },
  close: () => useRoomStore.setState({ closed: true }),
};
