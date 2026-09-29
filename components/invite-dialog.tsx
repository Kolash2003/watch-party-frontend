"use client";

import { Copy, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function InviteDialog({ code }: { code: string }) {
  const link = typeof window === "undefined" ? "" : `${window.location.origin}/join/${code}`;
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}><UserPlus /> Invite</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite friends</DialogTitle>
          <DialogDescription>Anyone with a WatchParty account can join with this link. Room code: <span className="font-mono">{code}</span></DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input readOnly value={link} aria-label="Invite link" onFocus={(e) => e.currentTarget.select()} />
          <Button onClick={() => navigator.clipboard.writeText(link).then(() => toast.success("Link copied"))}><Copy /> Copy</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
