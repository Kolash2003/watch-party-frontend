"use client";

import { Crown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Item, ItemActions, ItemContent, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { useRoomStore } from "@/lib/room-store";

export function PresenceList() {
  const members = useRoomStore((s) => s.members);
  const hostId = useRoomStore((s) => s.hostId);
  return (
    <ItemGroup className="gap-1">
      {members.map((m, i) => (
        <Item key={m.id} role="listitem" size="xs" style={{ "--i": i } as React.CSSProperties} className="enter hover:bg-muted/50">
          <ItemMedia className="relative">
            <Avatar className="size-8"><AvatarFallback className="bg-brand font-semibold text-white">{m.name.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
            <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-card" />
          </ItemMedia>
          <ItemContent><ItemTitle>{m.name}</ItemTitle></ItemContent>
          <ItemActions>
            {m.id === hostId && <Badge className="bg-amber-400/15 text-amber-300"><Crown /> Host</Badge>}
            {m.buffering && <Spinner className="text-muted-foreground" aria-label="Buffering" />}
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  );
}
