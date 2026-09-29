"use client";

import { useState } from "react";
import { Check, Copy, Link2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";

export function InviteDialog({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const link = typeof window === "undefined" ? "" : `${window.location.origin}/join/${code}`;
  const copy = (text: string, what: string) => navigator.clipboard.writeText(text).then(() => {
    toast.success(`${what} copied`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  });
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}><UserPlus /> Invite</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite friends</DialogTitle>
          <DialogDescription>Share the code (friends enter it under “Join” on their dashboard) or send the link.</DialogDescription>
        </DialogHeader>
        <button type="button" onClick={() => copy(code, "Code")} aria-label="Copy room code"
          className="rounded-lg border border-dashed py-3 font-mono text-2xl tracking-[0.3em] transition hover:border-primary hover:bg-muted">{code}</button>
        <InputGroup className="h-10">
          <InputGroupAddon><Link2 /></InputGroupAddon>
          <InputGroupInput readOnly value={link} aria-label="Invite link" onFocus={(e) => e.currentTarget.select()} />
          <InputGroupAddon align="inline-end">
            <InputGroupButton size="sm" variant={copied ? "secondary" : "default"} onClick={() => copy(link, "Link")} className="min-w-20 transition-all">
              {copied ? <><Check className="animate-in zoom-in-50" /> Copied</> : <><Copy /> Copy</>}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </DialogContent>
    </Dialog>
  );
}
