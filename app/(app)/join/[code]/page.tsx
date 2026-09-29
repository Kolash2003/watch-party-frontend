"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle>{error ? "Room not found" : "You're invited"}</CardTitle>
        <CardDescription>{error ? "This room doesn't exist or was closed." : room ? `${room.host.name} is watching “${room.video.title}”` : ""}</CardDescription>
      </CardHeader>
      <CardContent>
        {!room && !error && <Skeleton className="h-8" />}
        {room && <Button className="w-full" onClick={() => join.mutate()} disabled={join.isPending}>Join the party ({room.memberCount} watching)</Button>}
      </CardContent>
    </Card>
  );
}
