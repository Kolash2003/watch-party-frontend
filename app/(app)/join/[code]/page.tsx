"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { api, RoomInfo } from "@/lib/api";

export default function JoinPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { data: room, error } = useQuery({ queryKey: ["room", code], queryFn: () => api<RoomInfo>(`/rooms/${code}`) });
  const join = useMutation({
    mutationFn: () => api(`/rooms/${code}/join`, { method: "POST" }),
    onSuccess: () => router.replace(`/rooms/${code}`),
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card className="glass enter mx-auto mt-12 max-w-sm text-center shadow-2xl shadow-primary/10 [--card-spacing:--spacing(6)]">
      <CardHeader className="justify-items-center">
        <span className={`mb-2 grid size-16 place-items-center rounded-2xl shadow-xl ${error ? "bg-muted" : "bg-brand animate-bounce shadow-primary/40 [animation-iteration-count:2]"}`}>
          <PartyPopper className="size-8 text-white" />
        </span>
        <CardTitle className="text-2xl font-bold tracking-tight">{error ? "Room not found" : "You're invited"}</CardTitle>
        <CardDescription>{error ? "This room doesn't exist or was closed." : room ? `${room.host.name} is watching “${room.video.title}”` : ""}</CardDescription>
      </CardHeader>
      <CardContent>
        {!room && !error && <Skeleton className="shimmer h-10" />}
        {room && <Button size="lg" className="bg-brand h-11 w-full text-base text-white shadow-lg shadow-primary/30 transition hover:brightness-110 active:scale-[0.98]" onClick={() => join.mutate()} disabled={join.isPending}>
          {join.isPending && <Spinner />}Join the party · {room.memberCount} watching
        </Button>}
      </CardContent>
    </Card>
  );
}
