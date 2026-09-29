"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CircleAlert, Crown, DoorOpen, Maximize2, Minimize2, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatPanel } from "@/components/chat-panel";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { InviteDialog } from "@/components/invite-dialog";
import { PresenceList } from "@/components/presence-list";
import { WatchPlayer } from "@/components/watch-player";
import { useMe } from "@/hooks/use-me";
import { useRoomSocket } from "@/hooks/use-room-socket";
import { api, RoomInfo } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useRoomStore } from "@/lib/room-store";

const EMOJIS = ["😂", "😮", "❤️", "👏", "🔥", "😢"];

export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { data: me } = useMe();
  const [theater, setTheater] = useState(false);
  const [confirm, setConfirm] = useState<"leave" | "close" | null>(null);

  // Joining is idempotent; it also grants media access to invitees who opened the room URL directly.
  const { data: room, error } = useQuery({ queryKey: ["room-join", code], queryFn: () => api<RoomInfo>(`/rooms/${code}/join`, { method: "POST" }), staleTime: Infinity });
  useRoomSocket(code, !!room);

  const connected = useRoomStore((s) => s.connected);
  const hostId = useRoomStore((s) => s.hostId) ?? room?.host.id;
  const controlMode = useRoomStore((s) => s.controlMode);
  const members = useRoomStore((s) => s.members);
  const closed = useRoomStore((s) => s.closed);

  if (error) return (
    <Empty className="enter py-24">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-12 text-destructive"><CircleAlert className="size-6" /></EmptyMedia>
        <EmptyTitle>Couldn’t join this room</EmptyTitle>
        <EmptyDescription>{error.message}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent><Button onClick={() => router.push("/")}>Back to library</Button></EmptyContent>
    </Empty>
  );
  if (!room || !me) return <Skeleton className="shimmer aspect-video w-full max-w-4xl rounded-2xl" />;
  if (closed) return (
    <Empty className="enter py-24">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-12"><DoorOpen className="size-6" /></EmptyMedia>
        <EmptyTitle>This room was closed</EmptyTitle>
        <EmptyDescription>The host ended the party.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent><Button onClick={() => router.push("/")}>Back to library</Button></EmptyContent>
    </Empty>
  );

  const isHost = hostId === me.id;
  const canControl = isHost || controlMode === "EVERYONE";
  const hostName = members.find((m) => m.id === hostId)?.name ?? room.host.name;

  return (
    <div className="flex flex-col gap-3">
      <div className="glass flex flex-wrap items-center gap-2 rounded-xl px-4 py-3">
        <span className="relative flex size-2.5" title={connected ? "Live" : "Offline"}>
          {connected && <span className="animate-ping-soft absolute inline-flex size-full rounded-full bg-emerald-400" />}
          <span className={`relative inline-flex size-2.5 rounded-full ${connected ? "bg-emerald-400" : "bg-muted-foreground"}`} />
        </span>
        <h1 className="truncate text-lg font-semibold tracking-tight">{room.video.title}</h1>
        <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">{code}</span>
        {isHost && <Badge className="bg-amber-400/15 text-amber-300"><Crown /> Host</Badge>}
        {!connected && <Badge variant="destructive" className="animate-pulse"><WifiOff /> Reconnecting</Badge>}
        <div className="ml-auto flex items-center gap-2">
          <InviteDialog code={code} />
          <Button variant="outline" size="icon-sm" className="hidden lg:inline-flex" aria-label={theater ? "Exit theater mode" : "Theater mode"} onClick={() => setTheater(!theater)}>
            {theater ? <Minimize2 /> : <Maximize2 />}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setConfirm("leave")}><DoorOpen /> Leave</Button>
          {isHost && <Button variant="destructive" size="sm" onClick={() => setConfirm("close")}>Close room</Button>}
        </div>
      </div>

      <div className={`grid gap-4 ${theater ? "" : "lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]"}`}>
        <div className="flex flex-col gap-3">
          <WatchPlayer videoId={room.video.id} hasSubtitles={room.video.hasSubtitles} canControl={canControl} hostName={isHost ? undefined : hostName} />
          <div className="glass flex w-fit flex-wrap gap-1 self-center rounded-full px-2 py-1" role="group" aria-label="Reactions">
            {EMOJIS.map((e) => (
              <Button key={e} variant="ghost" size="icon" aria-label={`React ${e}`} className="pop rounded-full text-xl transition-transform hover:-translate-y-1 hover:scale-125 hover:bg-transparent" onClick={() => getSocket().emit("reaction:send", { emoji: e })}>{e}</Button>
            ))}
          </div>
        </div>
        {!theater && (
          <aside className="glass flex h-[28rem] min-h-0 animate-in fade-in slide-in-from-right-4 flex-col rounded-xl p-3 duration-500 lg:h-[calc(100dvh-13rem)]">
            <Tabs defaultValue="chat" className="min-h-0 flex-1">
              <TabsList className="w-full">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="people">People <span className="rounded-full bg-primary/20 px-1.5 text-xs text-primary tabular-nums">{members.length}</span></TabsTrigger>
              </TabsList>
              <TabsContent value="chat" className="min-h-0"><ChatPanel meId={me.id} /></TabsContent>
              <TabsContent value="people"><PresenceList /></TabsContent>
            </Tabs>
          </aside>
        )}
      </div>

      <ConfirmDialog
        open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm === "close" ? "Close this room?" : "Leave the room?"}
        description={confirm === "close" ? "Everyone will be disconnected and the invite link stops working." : "You can rejoin later with the invite link."}
        confirmLabel={confirm === "close" ? "Close room" : "Leave"}
        onConfirm={async () => {
          if (confirm === "close") await api(`/rooms/${code}`, { method: "DELETE" }).catch((e) => toast.error(e.message));
          router.push("/");
        }}
      />
    </div>
  );
}
