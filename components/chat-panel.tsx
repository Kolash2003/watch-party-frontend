"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getSocket } from "@/lib/socket";
import { useRoomStore } from "@/lib/room-store";

const time = (at: number) => new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export function ChatPanel({ meId }: { meId: string }) {
  const chat = useRoomStore((s) => s.chat);
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [chat.length]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <ScrollArea className="min-h-0 flex-1">
        <ul className="flex flex-col gap-2 pr-3" aria-live="polite">
          {chat.length === 0 && <li className="text-sm text-muted-foreground">No messages yet. Say hi 👋</li>}
          {chat.map((m) => (
            <li key={m.id} className="text-sm">
              <span className={`font-medium ${m.user.id === meId ? "text-primary" : ""}`}>{m.user.name}</span>{" "}
              <span className="font-mono text-xs text-muted-foreground">{time(m.at)}</span>
              {/* rendered as plain text, never HTML */}
              <p className="break-words whitespace-pre-wrap">{m.text}</p>
            </li>
          ))}
          <div ref={end} />
        </ul>
      </ScrollArea>
      <form
        className="flex gap-2"
        onSubmit={(e) => { e.preventDefault(); const t = text.trim(); if (!t) return; getSocket().emit("chat:send", { text: t }); setText(""); }}
      >
        <Input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Message" aria-label="Chat message" />
        <Button type="submit" size="icon" aria-label="Send"><Send /></Button>
      </form>
    </div>
  );
}
