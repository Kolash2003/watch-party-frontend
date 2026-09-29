"use client";

import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Message, MessageAvatar, MessageContent, MessageHeader } from "@/components/ui/message";
import { MessageScroller, MessageScrollerButton, MessageScrollerContent, MessageScrollerItem, MessageScrollerProvider, MessageScrollerViewport } from "@/components/ui/message-scroller";
import { getSocket } from "@/lib/socket";
import { useRoomStore } from "@/lib/room-store";

const time = (at: number) => new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export function ChatPanel({ meId }: { meId: string }) {
  const chat = useRoomStore((s) => s.chat);
  const [text, setText] = useState("");

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {chat.length === 0 ? (
        <Empty className="border-0">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="animate-bounce"><MessageCircle /></EmptyMedia>
            <EmptyTitle>No messages yet</EmptyTitle>
            <EmptyDescription>Say hi to the room 👋</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        // autoScroll only follows new messages while you're already at the bottom
        <MessageScrollerProvider autoScroll defaultScrollPosition="end">
          <MessageScroller className="flex-1">
            <MessageScrollerViewport aria-label="Chat messages">
              <MessageScrollerContent className="gap-3 py-2 pr-2">
                {chat.map((m, i) => {
                  const mine = m.user.id === meId;
                  // group consecutive messages from the same person
                  const first = chat[i - 1]?.user.id !== m.user.id;
                  return (
                    <MessageScrollerItem key={m.id} messageId={m.id} className={first ? "" : "-mt-2"}>
                      <Message align={mine ? "end" : "start"} className={`animate-in fade-in duration-300 ${mine ? "slide-in-from-right-2" : "slide-in-from-left-2"}`}>
                        {!mine && (
                          <MessageAvatar className={first ? "" : "invisible"}>
                            <Avatar className="size-7"><AvatarFallback className="bg-brand text-xs font-semibold text-white">{m.user.name.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
                          </MessageAvatar>
                        )}
                        <MessageContent className="gap-1">
                          {first && <MessageHeader className="gap-1.5">{!mine && <span className="text-foreground">{m.user.name}</span>}<span className="font-mono font-normal">{time(m.at)}</span></MessageHeader>}
                          <Bubble variant={mine ? "default" : "muted"} align={mine ? "end" : "start"}>
                            {/* rendered as plain text, never HTML */}
                            <BubbleContent className={`rounded-2xl whitespace-pre-wrap ${mine ? "bg-brand! rounded-br-sm text-white" : "rounded-bl-sm"}`}>{m.text}</BubbleContent>
                          </Bubble>
                        </MessageContent>
                      </Message>
                    </MessageScrollerItem>
                  );
                })}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton className="rounded-full shadow-lg" />
          </MessageScroller>
        </MessageScrollerProvider>
      )}
      <form onSubmit={(e) => { e.preventDefault(); const t = text.trim(); if (!t) return; getSocket().emit("chat:send", { text: t }); setText(""); }}>
        <InputGroup className="h-10 rounded-full pl-2">
          <InputGroupInput value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Say something…" aria-label="Chat message" />
          <InputGroupAddon align="inline-end">
            <InputGroupButton type="submit" size="icon-sm" aria-label="Send" disabled={!text.trim()} className="bg-brand rounded-full text-white transition hover:scale-110 active:scale-90 disabled:opacity-40">
              <Send />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </form>
    </div>
  );
}
