"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Clapperboard, LogOut, Upload } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/hooks/use-me";
import { api } from "@/lib/api";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: me, isError } = useMe();
  const router = useRouter();
  const path = usePathname();
  const qc = useQueryClient();

  useEffect(() => {
    if (isError) router.replace(`/login?next=${encodeURIComponent(path)}`);
  }, [isError, path, router]);

  if (!me) return <div className="p-8"><Skeleton className="h-8 w-40" /></div>;

  return (
    <>
      <header className="flex items-center gap-3 border-b px-4 py-2.5 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold"><Clapperboard className="size-5 text-primary" /> WatchParty</Link>
        <Link href="/upload" className={buttonVariants({ variant: "ghost", size: "sm", className: "ml-4" })}><Upload /> Upload</Link>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="ml-auto rounded-full" aria-label="Account" />}>
            <Avatar className="size-7"><AvatarFallback>{me.name.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{me.name}<br /><span className="font-normal text-muted-foreground">{me.email}</span></DropdownMenuLabel>
            <DropdownMenuItem onClick={async () => { await api("/auth/logout", { method: "POST" }); qc.clear(); router.replace("/login"); }}>
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">{children}</main>
    </>
  );
}
