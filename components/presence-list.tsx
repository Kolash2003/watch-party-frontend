"use client";

import { Crown, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useRoomStore } from "@/lib/room-store";

export function PresenceList() {
  const members = useRoomStore((s) => s.members);
  const hostId = useRoomStore((s) => s.hostId);
  return (
    <ul className="flex flex-col gap-2">
      {members.map((m) => (
        <li key={m.id} className="flex items-center gap-2 text-sm">
          <Avatar className="size-7"><AvatarFallback>{m.name.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
          <span className="truncate">{m.name}</span>
          {m.id === hostId && <Badge><Crown /> Host</Badge>}
          {m.buffering && <Loader2 className="ml-auto size-4 animate-spin text-muted-foreground" aria-label="Buffering" />}
        </li>
      ))}
    </ul>
  );
}
